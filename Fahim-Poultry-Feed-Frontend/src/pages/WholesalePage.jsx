import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { Link } from 'react-router-dom';

// MUI Imports
import {
    Box, Button, Typography, TextField, Table,
    TableBody, TableCell, TableContainer, TableHead,
    TableRow, Paper, Modal, Fade, CircularProgress
} from '@mui/material';

import { showErrorToast, showSuccessToast } from '../utils/notifications.js';
import TableSkeleton from '../components/TableSkeleton.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';

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
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [currentBuyer, setCurrentBuyer] = useState(null);
    const [modalType, setModalType] = useState('');
    const [amount, setAmount] = useState('');
    const [modalError, setModalError] = useState('');
    const [isModalLoading, setIsModalLoading] = useState(false);

    // --- State for Buyer Deletion ---
    const [openBuyerDialog, setOpenBuyerDialog] = useState(false);
    const [buyerToDelete, setBuyerToDelete] = useState(null);
    const [isDeletingBuyer, setIsDeletingBuyer] = useState(false);

    // --- State for Product Deletion ---
    const [openProductDialog, setOpenProductDialog] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);
    const [isDeletingProduct, setIsDeletingProduct] = useState(false);

    useEffect(() => {
        setIsLoading(true);
        const timerId = setTimeout(() => {
            const fetchBuyers = api.get(`/wholesale-buyers?search=${searchTerm}`);
            const fetchProducts = api.get('/wholesale-products');

            Promise.all([fetchBuyers, fetchProducts])
                .then(([buyersRes, productsRes]) => {
                    setBuyers(buyersRes.data);
                    setProducts(productsRes.data);
                })
                .catch(err => showErrorToast(err, 'Failed to fetch wholesale data.'))
                .finally(() => setIsLoading(false));
        }, 500);
        return () => clearTimeout(timerId);
    }, [searchTerm]);

    const handleBuyerDeleteClick = (buyer) => {
        setBuyerToDelete(buyer);
        setOpenBuyerDialog(true);
    };

    const handleConfirmBuyerDelete = async () => {
        if (!buyerToDelete) return;
        setIsDeletingBuyer(true);
        try {
            await api.delete(`/wholesale-buyers/${buyerToDelete._id}`);
            setBuyers(buyers.filter(b => b._id !== buyerToDelete._id));
            showSuccessToast('Buyer deleted successfully!');
        } catch (err) {
            showErrorToast(err, 'Failed to delete buyer.');
        } finally {
            setOpenBuyerDialog(false);
            setBuyerToDelete(null);
            setIsDeletingBuyer(false);
        }
    };
    
    const handleProductDeleteClick = (product) => {
        setProductToDelete(product);
        setOpenProductDialog(true);
    };

    const handleConfirmProductDelete = async () => {
        if (!productToDelete) return;
        setIsDeletingProduct(true);
        try {
            await api.delete(`/wholesale-products/${productToDelete._id}`);
            setProducts(products.filter(p => p._id !== productToDelete._id));
            showSuccessToast('Product deleted successfully!');
        } catch (err) {
            showErrorToast(err, 'Failed to delete product.');
        } finally {
            setOpenProductDialog(false);
            setProductToDelete(null);
            setIsDeletingProduct(false);
        }
    };
    
    const openModal = (buyer, type) => {
        setCurrentBuyer(buyer);
        setModalType(type);
        setModalIsOpen(true);
        setModalError('');
        setAmount('');
    };

    const closeModal = () => setModalIsOpen(false);

    const handleModalSubmit = async (e) => {
        e.preventDefault();
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            setModalError("Please enter a valid amount.");
            return;
        }
        setIsModalLoading(true);
        const endpoint = `/wholesale-buyers/${currentBuyer._id}/${modalType}`;
        try {
            const response = await api.patch(endpoint, { amount: numAmount });
            setBuyers(buyers.map(buyer => 
                buyer._id === response.data._id ? response.data : buyer
            ));
            showSuccessToast(`${modalType.charAt(0).toUpperCase() + modalType.slice(1)} successful!`);
            closeModal();
        } catch (err) { 
            showErrorToast(err, 'Transaction failed.');
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
                label="Search by name, business, or phone..."
                variant="outlined"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ mb: 3, backgroundColor: 'white' }}
            />

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ '& th': { backgroundColor: '#f4f6f8', fontWeight: 'bold' } }}>
                            <TableCell>Name</TableCell>
                            <TableCell>Business Name</TableCell>
                            <TableCell>Phone</TableCell>
                            <TableCell>Balance (TK)</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {isLoading ? (
                            <TableSkeleton columns={5} />
                        ) : buyers.length > 0 ? (
                            buyers.map((buyer) => (
                                <TableRow key={buyer._id} hover>
                                    <TableCell>
                                        <Typography component={Link} to={`/wholesale-buyers/${buyer._id}`} sx={{ fontWeight: 'bold', color: '#2C3E50', textDecoration: 'none' }}>
                                            {buyer.name}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>{buyer.businessName}</TableCell>
                                    <TableCell>{buyer.phone}</TableCell>
                                    <TableCell sx={{ color: buyer.balance < 0 ? 'error.main' : 'inherit' }}>
                                        {buyer.balance.toFixed(2)}
                                    </TableCell>
                                    <TableCell sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                        <Button onClick={() => openModal(buyer, 'deposit')} variant="contained" size="small">Deposit</Button>
                                        <Button onClick={() => openModal(buyer, 'withdrawal')} variant="outlined" size="small" color="warning">Withdraw</Button>
                                        <Button component={Link} to={`/edit-wholesale-buyer/${buyer._id}`} variant="outlined" size="small" color="info">Edit</Button>
                                        <Button onClick={() => handleBuyerDeleteClick(buyer)} variant="outlined" size="small" color="error">Delete</Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                             <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                                    <Typography color="text.secondary">
                                        No wholesale buyers found.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* --- Products Section --- */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 5, mb: 3 }}>
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
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {isLoading ? (
                            <TableSkeleton columns={2} />
                        ) : products.length > 0 ? (
                            products.map((product) => (
                                <TableRow key={product._id} hover>
                                    <TableCell>{product.name}</TableCell>
                                    <TableCell sx={{ display: 'flex', gap: 1 }}>
                                        <Button component={Link} to={`/edit-wholesale-product/${product._id}`} variant="outlined" size="small" color="info">Edit</Button>
                                        <Button onClick={() => handleProductDeleteClick(product)} variant="outlined" size="small" color="error">Delete</Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={2} align="center" sx={{ py: 4 }}>
                                    <Typography color="text.secondary">
                                        No wholesale products found.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <Modal open={modalIsOpen} onClose={closeModal} closeAfterTransition>
                <Fade in={modalIsOpen}>
                    <Box sx={modalStyle}>
                        <Typography variant="h6" component="h2">
                            {modalType === 'deposit' ? 'Make a Deposit' : 'Make a Withdrawal'} for {currentBuyer?.name}
                        </Typography>
                        <Box component="form" onSubmit={handleModalSubmit} noValidate sx={{ mt: 2 }}>
                            <TextField fullWidth autoFocus margin="dense" label="Amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} error={!!modalError} helperText={modalError} required />
                            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                <Button onClick={closeModal} disabled={isModalLoading}>Cancel</Button>
                                <Button type="submit" variant="contained" disabled={isModalLoading}>
                                    {isModalLoading ? <CircularProgress size={24} color="inherit" /> : 'Confirm'}
                                </Button>
                            </Box>
                        </Box>
                    </Box>
                </Fade>
            </Modal>

            <ConfirmDialog
                isOpen={openBuyerDialog}
                title="Confirm Buyer Deletion"
                message={`Are you sure you want to delete the buyer "${buyerToDelete?.name}"? This action cannot be undone.`}
                onConfirm={handleConfirmBuyerDelete}
                onCancel={() => setOpenBuyerDialog(false)}
                confirmButtonText="Delete"
                confirmColor="error"
                isLoading={isDeletingBuyer}
            />

            <ConfirmDialog
                isOpen={openProductDialog}
                title="Confirm Product Deletion"
                message={`Are you sure you want to delete the product "${productToDelete?.name}"? This action cannot be undone.`}
                onConfirm={handleConfirmProductDelete}
                onCancel={() => setOpenProductDialog(false)}
                confirmButtonText="Delete"
                confirmColor="error"
                isLoading={isDeletingProduct}
            />
        </Box>
    );
};

export default WholesalePage;