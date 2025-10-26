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

const ProductListPage = () => {
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true); // Table loading
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State (Add/Remove Stock)
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [currentProduct, setCurrentProduct] = useState(null);
    const [modalType, setModalType] = useState(''); // 'add' or 'remove'
    const [quantity, setQuantity] = useState('');
    // --- NEW: Modal validation error state ---
    const [modalError, setModalError] = useState('');
    // --- END NEW ---
    const [isModalLoading, setIsModalLoading] = useState(false); // Modal submission loading

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
    const [isRemovingStock, setIsRemovingStock] = useState(false);

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

    // Open Add/Remove Stock modal
    const openModal = (product, type) => {
        setCurrentProduct(product);
        setModalType(type);
        setQuantity(''); // Reset quantity
        setModalError(''); // Reset errors
        setIsModalLoading(false);
        setModalIsOpen(true);
    };

    // Generic close function for all modals/dialogs
    const closeModal = () => {
        setModalIsOpen(false);
        setOpenDeleteDialog(false);
        setOpenConfirmStockDialog(false);
        // Delay clearing state for animations
        setTimeout(() => {
            setCurrentProduct(null);
            setProductToDelete(null);
            setStockActionDetails(null);
            setQuantity('');
            setModalError('');
        }, 300);
    };

    // Handle Add/Remove Stock modal submission
    const handleModalSubmit = async (e) => {
        e.preventDefault();
        // --- NEW: Client-side validation ---
        const numQuantity = parseInt(quantity, 10);
        if (isNaN(numQuantity) || !Number.isInteger(numQuantity) || numQuantity <= 0) {
            setModalError("Please enter a valid positive whole number quantity.");
            return;
        }

        if (modalType === 'remove' && currentProduct && numQuantity > currentProduct.quantity) {
            setModalError(`Cannot remove more stock than available (${currentProduct.quantity}).`);
            return;
        }
        setModalError(''); // Clear error if validation passes
        // --- END NEW ---


        if (modalType === 'remove') {
            // Show confirmation dialog for removal
            setStockActionDetails({ product: currentProduct, quantity: numQuantity });
            setOpenConfirmStockDialog(true);
            // Don't close the primary modal yet, wait for confirmation dialog result
        } else { // Handle 'add' stock directly
            setIsModalLoading(true);
            const endpoint = `/products/${currentProduct._id}/addstock`;
            const body = { addQuantity: numQuantity };
            try {
                const response = await api.patch(endpoint, body);
                // Update product in local state
                setProducts(prev => prev.map(p => p._id === currentProduct._id ? response.data : p));
                showSuccessToast(`Stock added successfully!`);
                closeModal(); // Close modal on success
            } catch (err) {
                const errMsg = err.response?.data?.error || `Failed to add stock.`;
                setModalError(errMsg); // Show error in modal
                showErrorToast(err, `Failed to add stock.`); // Show toast
            } finally {
                setIsModalLoading(false);
            }
        }
    };

    // Handle confirmation for removing stock
    const handleConfirmStockRemove = async () => {
        if (!stockActionDetails) return;
        setIsRemovingStock(true); // Use dedicated loading state for confirm dialog

        const { product, quantity: removeQuantity } = stockActionDetails;
        const endpoint = `/products/${product._id}/removestock`;
        const body = { removeQuantity };

        try {
            const response = await api.patch(endpoint, body);
            // Update product in local state
            setProducts(prev => prev.map(p => p._id === product._id ? response.data : p));
            showSuccessToast(`Stock removed successfully!`);
        } catch (err) {
            // Show error (could potentially be displayed in the original modal if needed, but toast is simpler here)
            showErrorToast(err, `Failed to remove stock.`);
        } finally {
             // Close BOTH the confirmation dialog and the original stock modal
            setOpenConfirmStockDialog(false);
            setModalIsOpen(false); // Close the underlying add/remove modal
            setTimeout(() => { // Clear states after animation
                 setStockActionDetails(null);
                 setCurrentProduct(null);
                 setQuantity('');
                 setModalError('');
             }, 300);
            setIsRemovingStock(false);
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
            // Remove from local state
            setProducts(prev => prev.filter(p => p._id !== productToDelete._id));
            showSuccessToast('Product deleted successfully!');
        } catch (err) {
            showErrorToast(err, 'Failed to delete product.');
        } finally {
            closeModal(); // Use general close
            setIsDeleting(false);
        }
    };

    // Edit product functions
    const handleEditClick = (product) => {
        setEditRowId(product._id);
        // Exclude quantity from editable form data if desired
        setEditFormData({ name: product.name, sku: product.sku, price: product.price /*, quantity: product.quantity */ });
    };

    const handleCancelClick = () => setEditRowId(null);
    const handleEditFormChange = (e) => setEditFormData({ ...editFormData, [e.target.name]: e.target.value });

    const handleSaveClick = async (productId) => {
        setIsSavingEdit(true);
        // Simple client-side check for edit form (can be expanded)
        if (!editFormData.name?.trim() || !editFormData.sku?.trim() || !editFormData.price || parseFloat(editFormData.price) <= 0) {
            showErrorToast({ message: "Name, SKU, and a valid positive Price are required." });
            setIsSavingEdit(false);
            return;
        }

        try {
            const payload = { ...editFormData, price: parseFloat(editFormData.price) }; // Ensure price is number
            const response = await api.patch(`/products/${productId}`, payload);
            setProducts(prev => prev.map((p) => p._id === productId ? response.data : p));
            setEditRowId(null); // Exit edit mode
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
                         {/* Adjusted widths */}
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
                                     {/* Inline Editing Cells */}
                                    <TableCell>{editRowId === product._id ? <TextField name="name" value={editFormData.name} onChange={handleEditFormChange} size="small" variant="standard" fullWidth /> : product.name}</TableCell>
                                    <TableCell>{editRowId === product._id ? <TextField name="sku" value={editFormData.sku} onChange={handleEditFormChange} size="small" variant="standard" fullWidth /> : product.sku}</TableCell>
                                    <TableCell>{editRowId === product._id ? <TextField type="number" name="price" value={editFormData.price} onChange={handleEditFormChange} size="small" variant="standard" fullWidth inputProps={{ step: "0.01" }} /> : product.price.toFixed(2)}</TableCell>
                                    <TableCell>{product.quantity}</TableCell> {/* Keep quantity display-only */}
                                     {/* Actions Cell */}
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
                         {/* Empty State */}
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

            {/* Add/Remove Stock Modal */}
            <Modal open={modalIsOpen} onClose={closeModal} aria-labelledby="stock-modal-title" closeAfterTransition>
                <Fade in={modalIsOpen}>
                    <Box sx={modalStyle}>
                        <Typography id="stock-modal-title" variant="h6" component="h2">
                            {modalType === 'add' ? 'Add Stock' : 'Remove Stock'} for {currentProduct?.name}
                        </Typography>
                        <Box component="form" onSubmit={handleModalSubmit} noValidate sx={{ mt: 2 }}>
                            <TextField
                                fullWidth
                                autoFocus
                                margin="dense"
                                label="Quantity"
                                type="number"
                                value={quantity}
                                onChange={(e) => {
                                    setQuantity(e.target.value);
                                    // --- NEW: Clear error on change ---
                                    if (modalError) setModalError('');
                                    // --- END NEW ---
                                }}
                                // --- UPDATED: Show validation error ---
                                error={!!modalError}
                                helperText={modalError || 'Enter a positive whole number.'}
                                // --- END UPDATE ---
                                required
                                inputProps={{ min: 1, step: 1 }} // Input hints
                            />
                            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                <Button onClick={closeModal} disabled={isModalLoading}>Cancel</Button>
                                <Button type="submit" variant="contained" disabled={isModalLoading}>
                                     {/* Show loading only for 'add' type directly */}
                                    {isModalLoading && modalType === 'add' ? <CircularProgress size={24} color="inherit" /> : 'Confirm'}
                                </Button>
                            </Box>
                        </Box>
                    </Box>
                </Fade>
            </Modal>

            {/* Delete Product Confirmation Dialog */}
            <ConfirmDialog
                isOpen={openDeleteDialog}
                title="Confirm Product Deletion"
                message={`Are you sure you want to delete the product "${productToDelete?.name}"? This action cannot be undone.`}
                onConfirm={handleConfirmDelete}
                onCancel={closeModal}
                confirmButtonText="Delete"
                confirmColor="error"
                isLoading={isDeleting} // Pass deleting state
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