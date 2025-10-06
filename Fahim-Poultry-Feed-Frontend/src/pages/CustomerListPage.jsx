import React, { useState, useEffect } from 'react';
import api from '../api/api.js';
import { Link } from 'react-router-dom';

// MUI Imports
import {
    Box, Button, Typography, TextField, Table,
    TableBody, TableCell, TableContainer, TableHead,
    TableRow, Paper, CircularProgress, Modal, Fade
} from '@mui/material';

// Import our standardized notification utility
import { showErrorToast, showSuccessToast } from '../utils/notifications.js';

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

const CustomerListPage = () => {
    const [customers, setCustomers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [currentCustomer, setCurrentCustomer] = useState(null);
    const [modalType, setModalType] = useState('');
    const [amount, setAmount] = useState('');
    const [modalError, setModalError] = useState(''); // Kept for form validation feedback

    useEffect(() => {
        setIsLoading(true);
        const timerId = setTimeout(() => {
          api.get(`/customers?search=${searchTerm}`)
            .then(response => {
              setCustomers(response.data);
            })
            .catch(err => {
              showErrorToast(err, 'Failed to fetch customers.');
              setCustomers([]);
            })
            .finally(() => {
              setIsLoading(false);
            });
        }, 500);
        return () => clearTimeout(timerId);
    }, [searchTerm]);

    const openModal = (customer, type) => {
        setCurrentCustomer(customer);
        setModalType(type);
        setModalIsOpen(true);
        setAmount('');
        setModalError('');
    };

    const closeModal = () => setModalIsOpen(false);

    const handleModalSubmit = async (e) => {
        e.preventDefault();
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            setModalError("Please enter a valid positive amount.");
            return;
        }
        
        // Clear form validation error before API call
        setModalError('');

        const endpoint = `/customers/${currentCustomer._id}/${modalType}`;
        try {
            const response = await api.patch(endpoint, { amount: numAmount });
            const updatedCustomer = response.data;
            
            setCustomers(customers.map(c => c._id === updatedCustomer._id ? updatedCustomer : c));
            showSuccessToast(`${modalType.charAt(0).toUpperCase() + modalType.slice(1)} successful!`);
            closeModal();
        } catch (err) {
            showErrorToast(err, `Failed to process ${modalType}.`);
        }
    };
  
    const handleDelete = async (customerId) => {
        if (window.confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
            try {
                await api.delete(`/customers/${customerId}`);
                setCustomers(customers.filter(c => c._id !== customerId));
                showSuccessToast('Customer deleted successfully!');
            } catch (err) {
                showErrorToast(err, 'Failed to delete customer.');
            }
        }
    };

    return (
        <Box sx={{ padding: { xs: 1, sm: 2, md: 3 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">Customer List</Typography>
                <Button component={Link} to="/add-customer" variant="contained" color="success">+ Add New Customer</Button>
            </Box>
            
            <TextField
                fullWidth label="Search by name or phone..." variant="outlined"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ mb: 3, backgroundColor: 'white' }}
            />

            {isLoading && <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}><CircularProgress /></Box>}

            {!isLoading && (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ '& th': { backgroundColor: '#f4f6f8', fontWeight: 'bold' } }}>
                                <TableCell>Name</TableCell>
                                <TableCell>Phone</TableCell>
                                <TableCell>Balance (TK)</TableCell>
                                <TableCell sx={{ width: '40%' }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {customers.map((customer) => (
                                <TableRow key={customer._id} hover>
                                    <TableCell>
                                        <Typography component={Link} to={`/customers/${customer._id}`} sx={{ fontWeight: 'bold', color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                                            {customer.name}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>{customer.phone}</TableCell>
                                    <TableCell sx={{ color: customer.balance < 0 ? 'error.main' : 'inherit', fontWeight: 'bold' }}>
                                        {customer.balance.toFixed(2)}
                                    </TableCell>
                                    <TableCell sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                        <Button onClick={() => openModal(customer, 'deposit')} variant="contained" size="small">Deposit</Button>
                                        <Button onClick={() => openModal(customer, 'withdrawal')} variant="outlined" size="small" color="warning">Withdraw</Button>
                                        <Button component={Link} to={`/edit-customer/${customer._id}`} variant="outlined" size="small" color="info">Edit</Button>
                                        <Button onClick={() => handleDelete(customer._id)} variant="outlined" size="small" color="error">Delete</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <Modal open={modalIsOpen} onClose={closeModal} closeAfterTransition>
                <Fade in={modalIsOpen}>
                    <Box sx={modalStyle}>
                        <Typography variant="h6" component="h2">
                            {modalType === 'deposit' ? 'Make a Deposit' : 'Make a Withdrawal'} for {currentCustomer?.name}
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

export default CustomerListPage;