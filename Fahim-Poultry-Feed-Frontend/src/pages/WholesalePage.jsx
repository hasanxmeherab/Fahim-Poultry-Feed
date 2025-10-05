// frontend/src/pages/WholesalePage.jsx

import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { Link } from 'react-router-dom';

// --- MUI Imports ---
import {
    Box, Button, Typography, TextField, Table,
    TableBody, TableCell, TableContainer, TableHead,
    TableRow, Paper, CircularProgress, Modal, Fade
} from '@mui/material';

// Style for the MUI Modal
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
    // --- All your state and logic functions remain exactly the same ---
    const [buyers, setBuyers] = useState([]);
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [currentBuyer, setCurrentBuyer] = useState(null);
    const [modalType, setModalType] = useState('');
    const [amount, setAmount] = useState('');
    const [modalError, setModalError] = useState('');

    const fetchData = async () => {
        try {
            // Use the search term for buyers only
            const [buyersRes, productsRes] = await Promise.all([
                api.get(`/wholesale-buyers?search=${searchTerm}`),
                api.get('/wholesale-products')
            ]);
            setBuyers(buyersRes.data);
            setProducts(productsRes.data);
            setError(null);
        } catch (err) {
            setError('Failed to fetch data.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        setIsLoading(true);
        const timerId = setTimeout(() => {
            fetchData();
        }, 500);
        return () => clearTimeout(timerId);
    }, [searchTerm]);

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this buyer?')) {
            await api.delete(`/wholesale-buyers/${id}`);
            fetchData(); // Refetch data to update the list
        }
    };

    const handleDeleteProduct = async (productId) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                await api.delete(`/wholesale-products/${productId}`);
                // Filter out the deleted product from the state directly
                setProducts(products.filter(p => p._id !== productId));
            } catch (err) {
                alert('Failed to delete product.');
            }
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
        const endpoint = `/wholesale-buyers/${currentBuyer._id}/${modalType}`;
      try {
        const response = await api.patch(endpoint, { amount: numAmount });
        const updatedBuyer = response.data;

        setBuyers(buyers.map(buyer => 
            buyer._id === updatedBuyer._id ? updatedBuyer : buyer
        ));
        
        alert(`${modalType.charAt(0).toUpperCase() + modalType.slice(1)} successful!`);
        closeModal();

    } catch (err) { 
        setModalError(err.response?.data?.message || 'Transaction failed.');
    }
};
    // --- End of unchanged logic ---

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

            {isLoading && <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}><CircularProgress /></Box>}
            {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}

            {!isLoading && (
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
                            {buyers.map((buyer) => (
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
                                        <Button onClick={() => handleDelete(buyer._id)} variant="outlined" size="small" color="error">Delete</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

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
                        {products.map((product) => (
                            <TableRow key={product._id} hover>
                                <TableCell>{product.name}</TableCell>
                                <TableCell sx={{ display: 'flex', gap: 1 }}>
                                    <Button component={Link} to={`/edit-wholesale-product/${product._id}`} variant="outlined" size="small" color="info">Edit</Button>
                                    <Button onClick={() => handleDeleteProduct(product._id)} variant="outlined" size="small" color="error">Delete</Button>
                                </TableCell>
                            </TableRow>
                        ))}
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
                            <TextField
                                fullWidth autoFocus margin="dense" label="Amount" type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                error={!!modalError}
                                helperText={modalError}
                                required
                            />
                            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                <Button onClick={closeModal}>Cancel</Button>
                                <Button type="submit" variant="contained">Confirm</Button>
                            </Box>
                        </Box>
                    </Box>
                </Fade>
            </Modal>
        </Box>
    );
};

export default WholesalePage;