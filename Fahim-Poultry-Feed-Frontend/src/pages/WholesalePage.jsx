import React, { useState, useEffect, useCallback } from 'react'; // Added useCallback
import api from '../api/api';
import { Link } from 'react-router-dom';
import { debounce } from '@mui/material/utils'; // Import debounce

// MUI Imports
import {
    Box, Button, Typography, TextField, Table,
    TableBody, TableCell, TableContainer, TableHead,
    TableRow, Paper, Modal, Fade, CircularProgress
} from '@mui/material';

import { showErrorToast, showSuccessToast } from '../utils/notifications.js';
import TableSkeleton from '../components/TableSkeleton.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';

// Reusable modal style
const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    borderRadius: '8px',
    boxShadow: 24,
    p: 4,
};

const WholesalePage = () => {
    const [buyers, setBuyers] = useState([]);
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true); // Combined loading state
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State (Deposit/Withdrawal)
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [currentBuyer, setCurrentBuyer] = useState(null);
    const [modalType, setModalType] = useState(''); // 'deposit' or 'withdrawal'
    const [amount, setAmount] = useState('');
    // --- NEW: Modal validation error state ---
    const [modalError, setModalError] = useState('');
    // --- END NEW ---
    const [isModalLoading, setIsModalLoading] = useState(false); // Modal submission loading

    // State for Buyer Deletion
    const [openBuyerDialog, setOpenBuyerDialog] = useState(false);
    const [buyerToDelete, setBuyerToDelete] = useState(null);
    const [isDeletingBuyer, setIsDeletingBuyer] = useState(false);

    // State for Product Deletion
    const [openProductDialog, setOpenProductDialog] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);
    const [isDeletingProduct, setIsDeletingProduct] = useState(false);


    // Debounced fetch function
    const fetchData = useCallback(
        debounce(async (term) => {
            setIsLoading(true);
            try {
                const fetchBuyers = api.get(`/wholesale-buyers?search=${term}`);
                const fetchProducts = api.get('/wholesale-products'); // Products don't need search term here
                const [buyersRes, productsRes] = await Promise.all([fetchBuyers, fetchProducts]);
                setBuyers(buyersRes.data);
                setProducts(productsRes.data);
            } catch (err) {
                showErrorToast(err, 'Failed to fetch wholesale data.');
                setBuyers([]); // Clear data on error
                setProducts([]);
            } finally {
                setIsLoading(false);
            }
        }, 500),
        [] // Empty dependency array
    );

    // Effect to fetch data
    useEffect(() => {
        fetchData(searchTerm);
        return () => fetchData.clear();
    }, [searchTerm, fetchData]);


    // Buyer Delete functions
    const handleBuyerDeleteClick = (buyer) => {
        setBuyerToDelete(buyer);
        setOpenBuyerDialog(true);
    };

    const handleConfirmBuyerDelete = async () => {
        if (!buyerToDelete) return;
        setIsDeletingBuyer(true);
        try {
            await api.delete(`/wholesale-buyers/${buyerToDelete._id}`);
            setBuyers(prev => prev.filter(b => b._id !== buyerToDelete._id));
            showSuccessToast('Buyer deleted successfully!');
        } catch (err) {
            showErrorToast(err, 'Failed to delete buyer.');
        } finally {
            closeAllDialogs(); // Use generic close function
            setIsDeletingBuyer(false);
        }
    };

    // Product Delete functions
    const handleProductDeleteClick = (product) => {
        setProductToDelete(product);
        setOpenProductDialog(true);
    };

    const handleConfirmProductDelete = async () => {
        if (!productToDelete) return;
        setIsDeletingProduct(true);
        try {
            await api.delete(`/wholesale-products/${productToDelete._id}`);
            setProducts(prev => prev.filter(p => p._id !== productToDelete._id));
            showSuccessToast('Product deleted successfully!');
        } catch (err) {
            showErrorToast(err, 'Failed to delete product.');
        } finally {
            closeAllDialogs(); // Use generic close function
            setIsDeletingProduct(false);
        }
    };

    // Open Deposit/Withdrawal Modal
    const openTransactionModal = (buyer, type) => {
        setCurrentBuyer(buyer);
        setModalType(type);
        setAmount('');
        setModalError(''); // Clear errors on open
        setIsModalLoading(false);
        setModalIsOpen(true);
    };

    // Close ALL modals/dialogs
    const closeAllDialogs = () => {
        setModalIsOpen(false);
        setOpenBuyerDialog(false);
        setOpenProductDialog(false);
         // Delay clearing data for animations
        setTimeout(() => {
             setCurrentBuyer(null);
             setBuyerToDelete(null);
             setProductToDelete(null);
             setAmount('');
             setModalError('');
         }, 300);
    };

    // Handle Deposit/Withdrawal Submit
    const handleModalSubmit = async (e) => {
        e.preventDefault();
        // --- NEW: Client-side validation ---
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            setModalError("Please enter a valid positive amount.");
            return;
        }
        // No balance check needed here as per model logic (can have negative balance)
        setModalError(''); // Clear error if validation passes
        // --- END NEW ---

        setIsModalLoading(true);
        const endpoint = `/wholesale-buyers/${currentBuyer._id}/${modalType}`;
        try {
            const response = await api.patch(endpoint, { amount: numAmount });
            // Update the buyer in the local state
            setBuyers(prevBuyers =>
                prevBuyers.map(b => b._id === response.data._id ? response.data : b)
            );
            showSuccessToast(`${modalType.charAt(0).toUpperCase() + modalType.slice(1)} successful!`);
            closeAllDialogs(); // Close modal on success
        } catch (err) {
            const errMsg = err.response?.data?.message || err.response?.data?.error || 'Transaction failed.';
            setModalError(errMsg); // Show error in modal
            showErrorToast(err, 'Transaction failed.'); // Show toast
        } finally {
            setIsModalLoading(false);
        }
    };

    return (
        <Box sx={{ padding: { xs: 1, sm: 2, md: 3 } }}>
            {/* --- Buyers Section --- */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">Wholesale Buyers</Typography>
                <Button component={Link} to="/add-wholesale-buyer" variant="contained" color="success">
                    + Add New Buyer
                </Button>
            </Box>
            <TextField
                fullWidth
                label="Search Buyers by name, business, or phone..."
                variant="outlined"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ mb: 3, backgroundColor: 'white' }}
            />

            <TableContainer component={Paper} sx={{ mb: 5 }}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ '& th': { backgroundColor: '#f4f6f8', fontWeight: 'bold' } }}>
                            <TableCell>Name</TableCell>
                            <TableCell>Business Name</TableCell>
                            <TableCell>Phone</TableCell>
                            <TableCell>Balance (TK)</TableCell>
                            <TableCell sx={{ width: '35%' }}>Actions</TableCell> {/* Adjusted width */}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {isLoading ? (
                            <TableSkeleton columns={5} rowsNum={3} />
                        ) : buyers.length > 0 ? (
                            buyers.map((buyer) => (
                                <TableRow key={buyer._id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                    <TableCell>
                                        <Typography component={Link} to={`/wholesale-buyers/${buyer._id}`} sx={{ fontWeight: 'bold', color: '#2C3E50', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                                            {buyer.name}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>{buyer.businessName || 'N/A'}</TableCell>
                                    <TableCell>{buyer.phone}</TableCell>
                                    <TableCell sx={{ color: buyer.balance < 0 ? 'error.main' : 'inherit', fontWeight: 'medium' }}>
                                        {buyer.balance.toFixed(2)}
                                    </TableCell>
                                    <TableCell sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}> {/* Reduced gap */}
                                        <Button onClick={() => openTransactionModal(buyer, 'deposit')} variant="contained" size="small" sx={{ mr: 0.5 }}>Deposit</Button>
                                        <Button onClick={() => openTransactionModal(buyer, 'withdrawal')} variant="outlined" size="small" color="warning" sx={{ mr: 0.5 }}>Withdraw</Button>
                                        <Button component={Link} to={`/edit-wholesale-buyer/${buyer._id}`} variant="outlined" size="small" color="info" sx={{ mr: 0.5 }}>Edit</Button>
                                        <Button onClick={() => handleBuyerDeleteClick(buyer)} variant="outlined" size="small" color="error">Delete</Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                             <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                                    <Typography color="text.secondary">No wholesale buyers found.</Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* --- Products Section --- */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">Wholesale Products</Typography>
                <Button component={Link} to="/add-wholesale-product" variant="contained" color="success">
                    + Add New Product
                </Button>
            </Box>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ '& th': { backgroundColor: '#f4f6f8', fontWeight: 'bold' } }}>
                            <TableCell>Product Name</TableCell>
                            <TableCell sx={{ width: '25%' }}>Actions</TableCell> {/* Adjusted width */}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {isLoading ? ( // Use the same loading state for simplicity
                            <TableSkeleton columns={2} rowsNum={3} />
                        ) : products.length > 0 ? (
                            products.map((product) => (
                                <TableRow key={product._id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                    <TableCell>{product.name}</TableCell>
                                    <TableCell sx={{ display: 'flex', gap: 0.5 }}> {/* Reduced gap */}
                                        <Button component={Link} to={`/edit-wholesale-product/${product._id}`} variant="outlined" size="small" color="info" sx={{ mr: 0.5 }}>Edit</Button>
                                        <Button onClick={() => handleProductDeleteClick(product)} variant="outlined" size="small" color="error">Delete</Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={2} align="center" sx={{ py: 4 }}>
                                    <Typography color="text.secondary">No wholesale products added yet.</Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Deposit/Withdrawal Modal for Wholesale Buyer */}
            <Modal open={modalIsOpen} onClose={closeAllDialogs} closeAfterTransition>
                <Fade in={modalIsOpen}>
                    <Box sx={modalStyle}>
                        <Typography variant="h6" component="h2">
                            {modalType === 'deposit' ? 'Make Deposit' : 'Make Withdrawal'} for {currentBuyer?.name}
                        </Typography>
                        <Box component="form" onSubmit={handleModalSubmit} noValidate sx={{ mt: 2 }}>
                            <TextField
                                fullWidth
                                autoFocus
                                margin="dense"
                                label="Amount (TK)"
                                type="number"
                                value={amount}
                                onChange={(e) => {
                                    setAmount(e.target.value);
                                    // --- NEW: Clear error on change ---
                                    if (modalError) setModalError('');
                                    // --- END NEW ---
                                }}
                                // --- UPDATED: Show validation error ---
                                error={!!modalError}
                                helperText={modalError || 'Enter a positive amount.'}
                                // --- END UPDATE ---
                                required
                                inputProps={{ min: "0.01", step: "0.01" }}
                            />
                            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                <Button onClick={closeAllDialogs} disabled={isModalLoading}>Cancel</Button>
                                <Button type="submit" variant="contained" disabled={isModalLoading}>
                                    {isModalLoading ? <CircularProgress size={24} color="inherit" /> : 'Confirm'}
                                </Button>
                            </Box>
                        </Box>
                    </Box>
                </Fade>
            </Modal>

            {/* Buyer Delete Confirmation */}
            <ConfirmDialog
                isOpen={openBuyerDialog}
                title="Confirm Buyer Deletion"
                message={`Are you sure you want to delete the buyer "${buyerToDelete?.name}"? This action cannot be undone.`}
                onConfirm={handleConfirmBuyerDelete}
                onCancel={closeAllDialogs}
                confirmButtonText="Delete"
                confirmColor="error"
                isLoading={isDeletingBuyer}
            />

             {/* Product Delete Confirmation */}
            <ConfirmDialog
                isOpen={openProductDialog}
                title="Confirm Product Deletion"
                message={`Are you sure you want to delete the product "${productToDelete?.name}"? This action cannot be undone.`}
                onConfirm={handleConfirmProductDelete}
                onCancel={closeAllDialogs}
                confirmButtonText="Delete"
                confirmColor="error"
                isLoading={isDeletingProduct}
            />
        </Box>
    );
};

export default WholesalePage;