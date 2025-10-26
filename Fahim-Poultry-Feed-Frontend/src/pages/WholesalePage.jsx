import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/api';
import { Link } from 'react-router-dom';
import { debounce } from '@mui/material/utils';

// MUI Imports
import {
    Box, Button, Typography, TextField, Table,
    TableBody, TableCell, TableContainer, TableHead,
    TableRow, Paper, CircularProgress // Removed Modal, Fade
} from '@mui/material';

// Import reusable components
import { showErrorToast, showSuccessToast } from '../utils/notifications.js';
import TableSkeleton from '../components/TableSkeleton.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import AmountEntryModal from '../components/AmountEntryModal.jsx'; // Import the reusable modal

const WholesalePage = () => {
    const [buyers, setBuyers] = useState([]);
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true); // Combined loading state
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State (Deposit/Withdrawal) - Simplified
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [currentBuyer, setCurrentBuyer] = useState(null);
    const [modalType, setModalType] = useState(''); // 'deposit' or 'withdrawal'
    const [modalApiError, setModalApiError] = useState(''); // State specifically for API errors in the modal
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
                const fetchProducts = api.get('/wholesale-products');
                const [buyersRes, productsRes] = await Promise.all([fetchBuyers, fetchProducts]);
                setBuyers(buyersRes.data);
                setProducts(productsRes.data);
            } catch (err) {
                showErrorToast(err, 'Failed to fetch wholesale data.');
                setBuyers([]);
                setProducts([]);
            } finally {
                setIsLoading(false);
            }
        }, 500),
        []
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
            closeAllDialogs();
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
            closeAllDialogs();
            setIsDeletingProduct(false);
        }
    };

    // Open Deposit/Withdrawal Modal - Simpler
    const openTransactionModal = (buyer, type) => {
        setCurrentBuyer(buyer);
        setModalType(type);
        setModalApiError(''); // Clear previous API errors
        setIsModalLoading(false);
        setModalIsOpen(true);
    };

    // Close ALL modals/dialogs - Simpler
    const closeAllDialogs = () => {
        setModalIsOpen(false);
        setOpenBuyerDialog(false);
        setOpenProductDialog(false);
        setTimeout(() => {
             setCurrentBuyer(null);
             setBuyerToDelete(null);
             setProductToDelete(null);
             setModalApiError(''); // Clear API error on close
         }, 300); // Delay clearing data
    };

    // Handle Deposit/Withdrawal Submit - Receives validated amount
    const handleModalSubmit = async (submittedAmount) => {
        // No client-side validation needed here
        setIsModalLoading(true);
        setModalApiError(''); // Clear previous error
        const endpoint = `/wholesale-buyers/${currentBuyer._id}/${modalType}`;
        try {
            const response = await api.patch(endpoint, { amount: submittedAmount });
            setBuyers(prevBuyers =>
                prevBuyers.map(b => b._id === response.data._id ? response.data : b)
            );
            showSuccessToast(`${modalType.charAt(0).toUpperCase() + modalType.slice(1)} successful!`);
            closeAllDialogs();
        } catch (err) {
            const errMsg = err.response?.data?.message || err.response?.data?.error || 'Transaction failed.';
            setModalApiError(errMsg); // Set error state to pass to the modal
            showErrorToast(err, 'Transaction failed.'); // Show toast as well
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
                            <TableCell sx={{ width: '35%' }}>Actions</TableCell>
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
                                    <TableCell sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
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
                            <TableCell sx={{ width: '25%' }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {isLoading ? (
                            <TableSkeleton columns={2} rowsNum={3} />
                        ) : products.length > 0 ? (
                            products.map((product) => (
                                <TableRow key={product._id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                    <TableCell>{product.name}</TableCell>
                                    <TableCell sx={{ display: 'flex', gap: 0.5 }}>
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

            {/* --- USE REUSABLE MODAL for Deposit/Withdrawal --- */}
            <AmountEntryModal
                open={modalIsOpen}
                onClose={closeAllDialogs}
                onSubmit={handleModalSubmit}
                title={modalType === 'deposit' ? `Deposit for ${currentBuyer?.name}` : `Withdrawal for ${currentBuyer?.name}`}
                label="Amount (TK)"
                isLoading={isModalLoading}
                error={modalApiError} // Pass API error state
            />
            {/* --- END REUSABLE MODAL USAGE --- */}

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