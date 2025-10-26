import React, { useState, useEffect, useCallback } from 'react'; // Added useCallback
import api from '../api/api.js';
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

// Reusable modal style (consider moving to a shared file if used often)
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
    const [isLoading, setIsLoading] = useState(true); // For table loading
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [currentCustomer, setCurrentCustomer] = useState(null);
    const [modalType, setModalType] = useState(''); // 'deposit' or 'withdrawal'
    const [amount, setAmount] = useState('');
    // --- NEW: State for modal validation errors ---
    const [modalError, setModalError] = useState('');
    // --- END NEW ---
    const [isModalLoading, setIsModalLoading] = useState(false); // For modal submission loading

    // Delete Dialog State
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [customerToDelete, setCustomerToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false); // For delete action loading

    // Debounced search function
    const fetchCustomers = useCallback(
        debounce(async (term) => {
            setIsLoading(true); // Indicate loading when fetch starts
            try {
                const response = await api.get(`/customers?search=${term}`);
                setCustomers(response.data);
            } catch (err) {
                showErrorToast(err, 'Failed to fetch customers.');
                setCustomers([]); // Clear customers on error
            } finally {
                setIsLoading(false); // Stop loading indicator
            }
        }, 500), // 500ms delay
        [] // Empty dependency array means the debounced function is created once
    );

    // Effect to fetch customers on initial load and when searchTerm changes
    useEffect(() => {
        fetchCustomers(searchTerm);
        // Cleanup function to cancel debounce timer if component unmounts or searchTerm changes quickly
        return () => fetchCustomers.clear();
    }, [searchTerm, fetchCustomers]);

    // Open deposit/withdrawal modal
    const openModal = (customer, type) => {
        setCurrentCustomer(customer);
        setModalType(type);
        setModalIsOpen(true);
        setAmount('');
        setModalError(''); // Clear previous errors when opening
        setIsModalLoading(false); // Reset loading state
    };

    // Close any modal/dialog
    const closeModal = () => {
        setModalIsOpen(false);
        setOpenDeleteDialog(false);
        // Delay clearing data slightly for fade-out animations
        setTimeout(() => {
            setCurrentCustomer(null);
            setCustomerToDelete(null);
            setAmount('');
            setModalError('');
        }, 300);
    };

    // Handle submission of deposit/withdrawal modal
    const handleModalSubmit = async (e) => {
        e.preventDefault();
        // --- NEW: Client-side validation ---
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            setModalError("Please enter a valid positive amount.");
            return; // Stop if invalid
        }
        // Specific check for withdrawal
        if (modalType === 'withdrawal' && currentCustomer && numAmount > currentCustomer.balance) {
             setModalError(`Cannot withdraw more than the available balance (TK ${currentCustomer.balance.toFixed(2)}).`);
             return; // Stop if insufficient balance
        }
        setModalError(''); // Clear error if validation passes
        // --- END NEW ---

        setIsModalLoading(true);
        const endpoint = `/customers/${currentCustomer._id}/${modalType}`;
        try {
            const response = await api.patch(endpoint, { amount: numAmount });
            // Update the specific customer in the local state
            setCustomers(prevCustomers =>
                prevCustomers.map(c => c._id === response.data._id ? response.data : c)
            );
            showSuccessToast(`${modalType.charAt(0).toUpperCase() + modalType.slice(1)} successful!`);
            closeModal(); // Close modal on success
        } catch (err) {
            // Display error from backend response within the modal or use toast
            const errMsg = err.response?.data?.error || `Failed to process ${modalType}.`;
            setModalError(errMsg); // Show error in modal
            showErrorToast(err, `Failed to process ${modalType}.`); // Also show toast as backup
        } finally {
            setIsModalLoading(false); // Stop loading indicator
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
            // Remove the customer from the local state
            setCustomers(prevCustomers => prevCustomers.filter(c => c._id !== customerToDelete._id));
            showSuccessToast('Customer deleted successfully!');
        } catch (err) {
            showErrorToast(err, 'Failed to delete customer.');
        } finally {
            closeModal(); // Use the general close function
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
                            <TableSkeleton columns={4} rowsNum={5} /> // Show skeleton loading
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
                                    <TableCell sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}> {/* Reduced gap */}
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

            {/* Deposit/Withdrawal Modal */}
            <Modal
                open={modalIsOpen}
                onClose={closeModal}
                closeAfterTransition
                aria-labelledby="transaction-modal-title"
            >
                <Fade in={modalIsOpen}>
                    <Box sx={modalStyle}>
                        <Typography id="transaction-modal-title" variant="h6" component="h2">
                            {modalType === 'deposit' ? 'Make a Deposit' : 'Make a Withdrawal'} for {currentCustomer?.name}
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
                                inputProps={{ min: "0.01", step: "0.01" }} // Input hints
                            />
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

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={openDeleteDialog}
                title="Confirm Deletion"
                message={`Are you sure you want to delete the customer "${customerToDelete?.name}"? This also removes their transaction history and cannot be undone.`}
                onConfirm={handleConfirmDelete}
                onCancel={closeModal} // Use general close function
                confirmButtonText="Delete"
                confirmColor="error"
                isLoading={isDeleting} // Pass loading state
            />
        </Box>
    );
};

export default CustomerListPage;