import React, { useState, useEffect } from 'react';
import api from '../api/api.js';
import { Link } from 'react-router-dom';

// MUI Imports
import {
    Box, Button, Typography, TextField, Table,
    TableBody, TableCell, TableContainer, TableHead,
    TableRow, Paper, Modal, Fade,
    Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
    CircularProgress // Ensure CircularProgress is imported
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

const ProductListPage = () => {

    const [searchTerm, setSearchTerm] = useState('');
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [currentProduct, setCurrentProduct] = useState(null);
    const [modalType, setModalType] = useState('');
    const [quantity, setQuantity] = useState('');
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [formError, setFormError] = useState(null);
    const [editRowId, setEditRowId] = useState(null);
    const [editFormData, setEditFormData] = useState({});
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);
    const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
    const [stockActionDetails, setStockActionDetails] = useState(null);

    // ---LOADING STATES ---
    const [isModalLoading, setIsModalLoading] = useState(false);       
    const [isSavingEdit, setIsSavingEdit] = useState(false);          
    const [isDeleting, setIsDeleting] = useState(false);              
    const [isRemovingStock, setIsRemovingStock] = useState(false);     
    

    useEffect(() => {
        setIsLoading(true);
        const timerId = setTimeout(() => {
          api.get(`/products?search=${searchTerm}`)
            .then(response => setProducts(response.data))
            .catch(err => {
              showErrorToast(err, 'Failed to fetch products.');
              setProducts([]);
            })
            .finally(() => setIsLoading(false));
        }, 500);
        return () => clearTimeout(timerId);
    }, [searchTerm]);

    const openModal = (product, type) => {
        setCurrentProduct(product);
        setModalType(type);
        setModalIsOpen(true);
    };

    const closeModal = () => {
        setModalIsOpen(false);
        setQuantity('');
        setFormError(null);
        setCurrentProduct(null);
    };

    const handleModalSubmit = async (e) => {
        e.preventDefault();
        const numQuantity = parseInt(quantity, 10);
        if (isNaN(numQuantity) || numQuantity <= 0) {
          setFormError("Please enter a valid quantity greater than 0.");
          return;
        }
        
        if (modalType === 'remove') {
            if (numQuantity > currentProduct.quantity) {
              setFormError(`Cannot remove more than available stock (${currentProduct.quantity}).`);
              return;
            }
            setStockActionDetails({ product: currentProduct, quantity: numQuantity });
            setOpenConfirmDialog(true);
            closeModal();
        } else { // This is for 'add'
            setIsModalLoading(true);
            const body = { addQuantity: numQuantity };
            try {
              const response = await api.patch(`/products/${currentProduct._id}/addstock`, body);
              setProducts(products.map(p => p._id === currentProduct._id ? response.data : p));
              showSuccessToast(`Stock added successfully!`);
              closeModal();
            } catch (err) {
              showErrorToast(err, `Failed to add stock.`);
            } finally {
              setIsModalLoading(false);
            }
        }
    };

    const handleConfirmStockRemove = async () => {
        if (!stockActionDetails) return;
        setIsRemovingStock(true);
        const { product, quantity } = stockActionDetails;
        const body = { removeQuantity: quantity };
        try {
            const response = await api.patch(`/products/${product._id}/removestock`, body);
            setProducts(products.map(p => p._id === product._id ? response.data : p));
            showSuccessToast(`Stock removed successfully!`);
        } catch (err) {
            showErrorToast(err, `Failed to remove stock.`);
        } finally {
            setOpenConfirmDialog(false);
            setStockActionDetails(null);
            setIsRemovingStock(false);
        }
    };
    
    const handleDeleteClick = (product) => {
        setProductToDelete(product);
        setOpenDeleteDialog(true);
    };

    const handleConfirmDelete = async () => {
        if (!productToDelete) return;
        setIsDeleting(true);
        try {
            await api.delete(`/products/${productToDelete._id}`);
            setProducts(products.filter(p => p._id !== productToDelete._id));
            showSuccessToast('Product deleted successfully!');
        } catch (err) {
            showErrorToast(err, 'Failed to delete product.');
        } finally {
            setOpenDeleteDialog(false);
            setProductToDelete(null);
            setIsDeleting(false);
        }
    };

    const handleEditClick = (product) => {
        setEditRowId(product._id);
        setEditFormData({ name: product.name, sku: product.sku, price: product.price, quantity: product.quantity });
    };

    const handleCancelClick = () => setEditRowId(null);
    const handleEditFormChange = (e) => setEditFormData({ ...editFormData, [e.target.name]: e.target.value });

    const handleSaveClick = async (productId) => {
        setIsSavingEdit(true);
        try {
            const response = await api.patch(`/products/${productId}`, editFormData);
            setProducts(products.map((p) => p._id === productId ? response.data : p));
            setEditRowId(null);
            showSuccessToast('Product updated successfully!');
        } catch (err) {
            showErrorToast(err, "Could not update product.");
        } finally {
            setIsSavingEdit(false);
        }
    };

    return (
        <Box sx={{ padding: { xs: 1, sm: 2, md: 3 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">Inventory</Typography>
                <Button component={Link} to="/add-product" variant="contained" color="success" sx={{ whiteSpace: 'nowrap' }}>
                    + Add New Product
                </Button>
            </Box>
            <TextField fullWidth label="Search by name or SKU..." variant="outlined" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} sx={{ mb: 3, backgroundColor: 'white' }} />

            <TableContainer component={Paper}>
                <Table sx={{ tableLayout: 'fixed' }}>
                    <TableHead>
                        <TableRow sx={{ '& th': { backgroundColor: '#f4f6f8', fontWeight: 'bold' } }}>
                            <TableCell sx={{ width: '24%' }}>Product Name</TableCell>
                            <TableCell sx={{ width: '19%' }}>SKU</TableCell>
                            <TableCell sx={{ width: '17%' }}>Price (TK)</TableCell>
                            <TableCell sx={{ width: '13%' }}>In Stock</TableCell>
                            <TableCell sx={{ width: '30%' }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {isLoading ? ( <TableSkeleton columns={5} /> ) : (
                            products.map((product) => (
                                <TableRow key={product._id} hover>
                                    <TableCell>{editRowId === product._id ? <TextField name="name" value={editFormData.name} onChange={handleEditFormChange} size="small" variant="standard" fullWidth /> : product.name}</TableCell>
                                    <TableCell>{editRowId === product._id ? <TextField name="sku" value={editFormData.sku} onChange={handleEditFormChange} size="small" variant="standard" fullWidth /> : product.sku}</TableCell>
                                    <TableCell>{editRowId === product._id ? <TextField type="number" name="price" value={editFormData.price} onChange={handleEditFormChange} size="small" variant="standard" fullWidth /> : product.price.toFixed(2)}</TableCell>
                                    <TableCell>{editRowId === product._id ? <TextField type="number" name="quantity" value={editFormData.quantity} onChange={handleEditFormChange} size="small" variant="standard" fullWidth disabled /> : product.quantity}</TableCell>
                                    <TableCell sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                        {editRowId === product._id ? (
                                            <>
                                                <Button onClick={() => handleSaveClick(product._id)} variant="contained" size="small" color="success" disabled={isSavingEdit}>
                                                    {isSavingEdit ? <CircularProgress size={20} color="inherit" /> : 'Save'}
                                                </Button>
                                                <Button onClick={handleCancelClick} variant="outlined" size="small" disabled={isSavingEdit}>Cancel</Button>
                                            </>
                                        ) : (
                                            <>
                                                <Button onClick={() => openModal(product, 'add')} variant="contained" size="small">Add Stock</Button>
                                                <Button onClick={() => openModal(product, 'remove')} variant="outlined" size="small" color="warning">Remove</Button>
                                                <Button onClick={() => handleEditClick(product)} variant="outlined" size="small" color="info">Edit</Button>
                                                <Button onClick={() => handleDeleteClick(product)} variant="outlined" size="small" color="error">Delete</Button>
                                            </>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <Modal open={modalIsOpen} onClose={closeModal} aria-labelledby="stock-modal-title" closeAfterTransition>
                <Fade in={modalIsOpen}>
                    <Box sx={modalStyle}>
                        <Typography id="stock-modal-title" variant="h6" component="h2">{modalType === 'add' ? 'Add Stock' : 'Remove Stock'} for {currentProduct?.name}</Typography>
                        <Box component="form" onSubmit={handleModalSubmit} noValidate sx={{ mt: 2 }}>
                            <TextField fullWidth autoFocus margin="dense" label="Quantity" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} error={!!formError} helperText={formError} required />
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
                isOpen={openDeleteDialog}
                title="Confirm Deletion"
                message={`Are you sure you want to delete the product "${productToDelete?.name}"? This action cannot be undone.`}
                onConfirm={handleConfirmDelete}
                onCancel={() => setOpenDeleteDialog(false)}
                confirmButtonText="Delete"
                confirmColor="error"
                isLoading={isDeleting}
            />

            <ConfirmDialog
                isOpen={openConfirmDialog}
                title="Confirm Stock Removal"
                message={`Are you sure you want to remove ${stockActionDetails?.quantity} unit(s) of ${stockActionDetails?.product?.name}? This action cannot be undone.`}
                onConfirm={handleConfirmStockRemove}
                onCancel={() => setOpenConfirmDialog(false)}
                confirmButtonText="Yes, Remove"
                confirmColor="warning"
                isLoading={isRemovingStock}
            />
        </Box>
    );
};

export default ProductListPage;