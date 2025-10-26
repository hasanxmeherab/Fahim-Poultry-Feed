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

const ProductListPage = () => {
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true); // Table loading
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State (Add/Remove Stock) - Simplified
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [currentProduct, setCurrentProduct] = useState(null);
    const [modalType, setModalType] = useState(''); // 'add' or 'remove'
    const [modalApiError, setModalApiError] = useState(''); // State specifically for API errors in the modal
    const [isModalLoading, setIsModalLoading] = useState(false); // Modal submission loading ('add' only for now)

    // Edit State
    const [editRowId, setEditRowId] = useState(null);
    const [editFormData, setEditFormData] = useState({});
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    // Delete Dialog State
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Remove Stock Confirmation Dialog State
    const [openConfirmStockDialog, setOpenConfirmStockDialog] = useState(false);
    const [stockActionDetails, setStockActionDetails] = useState(null); // { product, quantity }
    const [isRemovingStock, setIsRemovingStock] = useState(false); // Loading state for confirmation

    // Debounced search function
    const fetchProducts = useCallback(
        debounce(async (term) => {
            setIsLoading(true);
            try {
                const response = await api.get(`/products?search=${term}`);
                setProducts(response.data);
            } catch (err) {
                showErrorToast(err, 'Failed to fetch products.');
                setProducts([]);
            } finally {
                setIsLoading(false);
            }
        }, 500),
        []
    );

    // Effect for fetching products
    useEffect(() => {
        fetchProducts(searchTerm);
        return () => fetchProducts.clear();
    }, [searchTerm, fetchProducts]);

    // Open Add/Remove Stock modal - Simpler
    const openModal = (product, type) => {
        setCurrentProduct(product);
        setModalType(type);
        setModalApiError(''); // Clear previous API errors
        setIsModalLoading(false);
        setModalIsOpen(true);
    };

    // Generic close function for all modals/dialogs - Simpler
    const closeModal = () => {
        setModalIsOpen(false);
        setOpenDeleteDialog(false);
        setOpenConfirmStockDialog(false);
        setTimeout(() => {
            setCurrentProduct(null);
            setProductToDelete(null);
            setStockActionDetails(null);
            setModalApiError(''); // Clear API error on close
        }, 300); // Delay clearing data
    };

    // Handle submission trigger from AmountEntryModal - Receives validated quantity
    const handleModalSubmit = async (submittedQuantity) => {
        setModalApiError(''); // Clear previous API error

        if (modalType === 'remove') {
            // Check if attempting to remove more than available before showing confirmation
            if (currentProduct && submittedQuantity > currentProduct.quantity) {
                 setModalApiError(`Cannot remove more stock than available (${currentProduct.quantity}).`);
                 // Keep the AmountEntryModal open to show the error
                 return;
            }
            // If valid, set details for confirmation dialog
            setStockActionDetails({ product: currentProduct, quantity: submittedQuantity });
            setOpenConfirmStockDialog(true);
            // Don't close AmountEntryModal yet, confirmation will handle closing both
        }
        else if (modalType === 'add') { // Handle 'add' stock directly
            setIsModalLoading(true);
            const endpoint = `/products/${currentProduct._id}/addstock`;
            const body = { addQuantity: submittedQuantity };
            try {
                const response = await api.patch(endpoint, body);
                setProducts(prev => prev.map(p => p._id === currentProduct._id ? response.data : p));
                showSuccessToast(`Stock added successfully!`);
                closeModal(); // Close modal on success
            } catch (err) {
                const errMsg = err.response?.data?.error || `Failed to add stock.`;
                setModalApiError(errMsg); // Pass API error back to modal
                showErrorToast(err, `Failed to add stock.`);
            } finally {
                setIsModalLoading(false);
            }
        }
    };

    // Handle confirmation for removing stock
    const handleConfirmStockRemove = async () => {
        if (!stockActionDetails) return;
        setIsRemovingStock(true);

        const { product, quantity: removeQuantity } = stockActionDetails;
        const endpoint = `/products/${product._id}/removestock`;
        const body = { removeQuantity };

        try {
            const response = await api.patch(endpoint, body);
            setProducts(prev => prev.map(p => p._id === product._id ? response.data : p));
            showSuccessToast(`Stock removed successfully!`);
            closeModal(); // Close both confirmation and underlying modal
        } catch (err) {
            showErrorToast(err, `Failed to remove stock.`);
            // Optionally, set modalApiError here if you want error in AmountEntryModal after confirm fails
            // setModalApiError(err.response?.data?.error || 'Failed to remove stock.');
            setOpenConfirmStockDialog(false); // Close only confirm dialog on error
        } finally {
            setIsRemovingStock(false);
            // State clearing now handled mostly by closeModal
        }
    };

    // Delete product functions
    const handleDeleteClick = (product) => {
        setProductToDelete(product);
        setOpenDeleteDialog(true);
    };

    const handleConfirmDelete = async () => {
        if (!productToDelete) return;
        setIsDeleting(true);
        try {
            await api.delete(`/products/${productToDelete._id}`);
            setProducts(prev => prev.filter(p => p._id !== productToDelete._id));
            showSuccessToast('Product deleted successfully!');
        } catch (err) {
            showErrorToast(err, 'Failed to delete product.');
        } finally {
            closeModal();
            setIsDeleting(false);
        }
    };

    // Edit product functions
    const handleEditClick = (product) => {
        setEditRowId(product._id);
        setEditFormData({ name: product.name, sku: product.sku, price: product.price });
    };

    const handleCancelClick = () => setEditRowId(null);
    const handleEditFormChange = (e) => setEditFormData({ ...editFormData, [e.target.name]: e.target.value });

    const handleSaveClick = async (productId) => {
        setIsSavingEdit(true);
        if (!editFormData.name?.trim() || !editFormData.sku?.trim() || !editFormData.price || parseFloat(editFormData.price) <= 0) {
            showErrorToast({ message: "Name, SKU, and a valid positive Price are required." });
            setIsSavingEdit(false);
            return;
        }
        try {
            const payload = { ...editFormData, price: parseFloat(editFormData.price) };
            const response = await api.patch(`/products/${productId}`, payload);
            setProducts(prev => prev.map((p) => p._id === productId ? response.data : p));
            setEditRowId(null);
            showSuccessToast('Product updated successfully!');
        } catch (err) {
            showErrorToast(err, "Could not update product. SKU might already exist.");
        } finally {
            setIsSavingEdit(false);
        }
    };

    return (
        <Box sx={{ padding: { xs: 1, sm: 2, md: 3 } }}>
            {/* Header and Add Button */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">Inventory</Typography>
                <Button component={Link} to="/add-product" variant="contained" color="success" sx={{ whiteSpace: 'nowrap' }}>
                    + Add New Product
                </Button>
            </Box>

            {/* Search Bar */}
            <TextField fullWidth label="Search by name or SKU..." variant="outlined" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} sx={{ mb: 3, backgroundColor: 'white' }} />

            {/* Products Table */}
            <TableContainer component={Paper}>
                <Table sx={{ tableLayout: 'fixed' }}>
                    <TableHead>
                        <TableRow sx={{ '& th': { backgroundColor: '#f4f6f8', fontWeight: 'bold' } }}>
                            <TableCell sx={{ width: '25%' }}>Product Name</TableCell>
                            <TableCell sx={{ width: '20%' }}>SKU</TableCell>
                            <TableCell sx={{ width: '15%' }}>Price (TK)</TableCell>
                            <TableCell sx={{ width: '10%' }}>In Stock</TableCell>
                            <TableCell sx={{ width: '30%' }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {isLoading ? ( <TableSkeleton columns={5} rowsNum={5} /> ) : (
                            products.map((product) => (
                                <TableRow key={product._id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                    <TableCell>{editRowId === product._id ? <TextField name="name" value={editFormData.name} onChange={handleEditFormChange} size="small" variant="standard" fullWidth /> : product.name}</TableCell>
                                    <TableCell>{editRowId === product._id ? <TextField name="sku" value={editFormData.sku} onChange={handleEditFormChange} size="small" variant="standard" fullWidth /> : product.sku}</TableCell>
                                    <TableCell>{editRowId === product._id ? <TextField type="number" name="price" value={editFormData.price} onChange={handleEditFormChange} size="small" variant="standard" fullWidth inputProps={{ step: "0.01" }} /> : product.price.toFixed(2)}</TableCell>
                                    <TableCell>{product.quantity}</TableCell>
                                    <TableCell sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {editRowId === product._id ? (
                                            <>
                                                <Button onClick={() => handleSaveClick(product._id)} variant="contained" size="small" color="success" disabled={isSavingEdit} sx={{ mr: 0.5 }}>
                                                    {isSavingEdit ? <CircularProgress size={20} color="inherit" /> : 'Save'}
                                                </Button>
                                                <Button onClick={handleCancelClick} variant="outlined" size="small" disabled={isSavingEdit}>Cancel</Button>
                                            </>
                                        ) : (
                                            <>
                                                <Button onClick={() => openModal(product, 'add')} variant="contained" size="small" sx={{ mr: 0.5 }}>Add</Button>
                                                <Button onClick={() => openModal(product, 'remove')} variant="outlined" size="small" color="warning" sx={{ mr: 0.5 }}>Remove</Button>
                                                <Button onClick={() => handleEditClick(product)} variant="outlined" size="small" color="info" sx={{ mr: 0.5 }}>Edit</Button>
                                                <Button onClick={() => handleDeleteClick(product)} variant="outlined" size="small" color="error">Delete</Button>
                                            </>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                        {!isLoading && products.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                                    <Typography color="text.secondary">No products found.</Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* --- USE REUSABLE MODAL for Add/Remove Stock --- */}
            <AmountEntryModal
                open={modalIsOpen && !openConfirmStockDialog} // Keep open if confirm dialog is active
                onClose={closeModal}
                onSubmit={handleModalSubmit}
                title={`${modalType === 'add' ? 'Add' : 'Remove'} Stock for ${currentProduct?.name}`}
                label="Quantity"
                inputType="integer" // Specify integer input
                isLoading={isModalLoading && modalType === 'add'} // Only show direct loading for 'add'
                error={modalApiError} // Pass API error state
                helperText="Enter a positive whole number."
                submitText={modalType === 'remove' ? 'Next' : 'Confirm'} // Change button text for remove flow
            />
            {/* --- END REUSABLE MODAL USAGE --- */}

            {/* Delete Product Confirmation Dialog */}
            <ConfirmDialog
                isOpen={openDeleteDialog}
                title="Confirm Product Deletion"
                message={`Are you sure you want to delete the product "${productToDelete?.name}"? This action cannot be undone.`}
                onConfirm={handleConfirmDelete}
                onCancel={closeModal}
                confirmButtonText="Delete"
                confirmColor="error"
                isLoading={isDeleting}
            />

            {/* Remove Stock Confirmation Dialog */}
            <ConfirmDialog
                isOpen={openConfirmStockDialog}
                title="Confirm Stock Removal"
                message={`Are you sure you want to remove ${stockActionDetails?.quantity} unit(s) of ${stockActionDetails?.product?.name}? This action cannot be undone.`}
                onConfirm={handleConfirmStockRemove}
                onCancel={closeModal} // Close both dialogs on cancel
                confirmButtonText="Yes, Remove"
                confirmColor="warning"
                isLoading={isRemovingStock} // Pass remove stock loading state
            />
        </Box>
    );
};

export default ProductListPage;