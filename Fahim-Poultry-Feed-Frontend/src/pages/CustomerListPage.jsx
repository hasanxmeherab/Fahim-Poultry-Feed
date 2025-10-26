import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/api.js';
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

const CustomerListPage = () => {
    const [customers, setCustomers] = useState([]);
    const [isLoading, setIsLoading] = useState(true); // For table loading
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State - Simplified
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [currentCustomer, setCurrentCustomer] = useState(null);
    const [modalType, setModalType] = useState(''); // 'deposit' or 'withdrawal'
    const [modalApiError, setModalApiError] = useState(''); // State specifically for API errors in the modal
    const [isModalLoading, setIsModalLoading] = useState(false); // For modal submission loading

    // Delete Dialog State
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [customerToDelete, setCustomerToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false); // For delete action loading

    // Debounced search function
    const fetchCustomers = useCallback(
        debounce(async (term) => {
            setIsLoading(true);
            try {
                const response = await api.get(`/customers?search=${term}`);
                setCustomers(response.data);
            } catch (err) {
                showErrorToast(err, 'Failed to fetch customers.');
                setCustomers([]);
            } finally {
                setIsLoading(false);
            }
        }, 500),
        []
    );

    // Effect to fetch customers
    useEffect(() => {
        fetchCustomers(searchTerm);
        return () => fetchCustomers.clear();
    }, [searchTerm, fetchCustomers]);

    // Open deposit/withdrawal modal - Simpler now
    const openModal = (customer, type) => {
        setCurrentCustomer(customer);
        setModalType(type);
        setModalApiError(''); // Clear previous API errors
        setIsModalLoading(false);
        setModalIsOpen(true);
    };

    // Close any modal/dialog - Simpler now
    const closeModal = () => {
        setModalIsOpen(false);
        setOpenDeleteDialog(false);
        setTimeout(() => {
            setCurrentCustomer(null);
            setCustomerToDelete(null);
            setModalApiError(''); // Clear API error on close
        }, 300); // Delay clearing data
    };

    // Handle submission of deposit/withdrawal modal - Receives amount
    const handleModalSubmit = async (submittedAmount) => {
        // No client-side validation needed here, AmountEntryModal handles it
        setIsModalLoading(true);
        setModalApiError(''); // Clear previous API error before new attempt
        const endpoint = `/customers/${currentCustomer._id}/${modalType}`;
        try {
            const response = await api.patch(endpoint, { amount: submittedAmount });
            setCustomers(prevCustomers =>
                prevCustomers.map(c => c._id === response.data._id ? response.data : c)
            );
            showSuccessToast(`${modalType.charAt(0).toUpperCase() + modalType.slice(1)} successful!`);
            closeModal(); // Close modal on success
        } catch (err) {
            // Get error message from backend or default
            const errMsg = err.response?.data?.message || err.response?.data?.error || `Failed to process ${modalType}.`;
            setModalApiError(errMsg); // Set API error state to pass to the modal
            showErrorToast(err, `Failed to process ${modalType}.`); // Also show toast
        } finally {
            setIsModalLoading(false);
        }
    };

    // Functions for delete confirmation
    const handleDeleteClick = (customer) => {
        setCustomerToDelete(customer);
        setOpenDeleteDialog(true);
    };

    const handleConfirmDelete = async () => {
        if (!customerToDelete) return;
        setIsDeleting(true);
        try {
            await api.delete(`/customers/${customerToDelete._id}`);
            setCustomers(prevCustomers => prevCustomers.filter(c => c._id !== customerToDelete._id));
            showSuccessToast('Customer deleted successfully!');
        } catch (err) {
            showErrorToast(err, 'Failed to delete customer.');
        } finally {
            closeModal();
            setIsDeleting(false);
        }
    };

    return (
        <Box sx={{ padding: { xs: 1, sm: 2, md: 3 } }}>
            {/* Header and Add Button */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">Customers</Typography>
                <Button component={Link} to="/add-customer" variant="contained" color="success">+ Add New Customer</Button>
            </Box>

            {/* Search Bar */}
            <TextField
                fullWidth label="Search by name or phone..." variant="outlined"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ mb: 3, backgroundColor: 'white' }}
            />

            {/* Customers Table */}
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
                        {isLoading ? (
                            <TableSkeleton columns={4} rowsNum={5} />
                        ) : customers.length > 0 ? (
                            customers.map((customer) => (
                                <TableRow key={customer._id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                    <TableCell component="th" scope="row">
                                        <Typography component={Link} to={`/customers/${customer._id}`} sx={{ fontWeight: 'bold', color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                                            {customer.name}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>{customer.phone}</TableCell>
                                    <TableCell sx={{ color: customer.balance < 0 ? 'error.main' : 'inherit', fontWeight: 'medium' }}>
                                        {customer.balance.toFixed(2)}
                                    </TableCell>
                                    <TableCell sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        <Button onClick={() => openModal(customer, 'deposit')} variant="contained" size="small" sx={{ mr: 0.5 }}>Deposit</Button>
                                        <Button onClick={() => openModal(customer, 'withdrawal')} variant="outlined" size="small" color="warning" sx={{ mr: 0.5 }}>Withdraw</Button>
                                        <Button component={Link} to={`/edit-customer/${customer._id}`} variant="outlined" size="small" color="info" sx={{ mr: 0.5 }}>Edit</Button>
                                        <Button onClick={() => handleDeleteClick(customer)} variant="outlined" size="small" color="error">Delete</Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                                    <Typography color="text.secondary">No customers found matching your search.</Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* --- USE REUSABLE MODAL --- */}
            <AmountEntryModal
                open={modalIsOpen}
                onClose={closeModal}
                onSubmit={handleModalSubmit} // Pass the correct submit handler
                title={modalType === 'deposit' ? `Deposit for ${currentCustomer?.name}` : `Withdrawal for ${currentCustomer?.name}`}
                label="Amount (TK)"
                isLoading={isModalLoading}
                error={modalApiError} // Pass the API error state here
                // Optionally add helper text if needed, default is fine
                // helperText="Enter a positive amount."
            />
            {/* --- END REUSABLE MODAL USAGE --- */}

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={openDeleteDialog}
                title="Confirm Deletion"
                message={`Are you sure you want to delete the customer "${customerToDelete?.name}"? This also removes their transaction history and cannot be undone.`}
                onConfirm={handleConfirmDelete}
                onCancel={closeModal}
                confirmButtonText="Delete"
                confirmColor="error"
                isLoading={isDeleting}
            />
        </Box>
    );
};

export default CustomerListPage;