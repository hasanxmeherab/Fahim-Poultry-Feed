import React, { useState, useEffect } from 'react';
import api from '../api/api.js';
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

const ProductListPage = () => {
    // --- All of your state and logic functions remain exactly the same ---
    const [searchTerm, setSearchTerm] = useState('');
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [currentProduct, setCurrentProduct] = useState(null);
    const [modalType, setModalType] = useState(''); // 'add' or 'remove'
    const [quantity, setQuantity] = useState('');
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [apiError, setApiError] = useState(null);
    const [formError, setFormError] = useState(null);

    // --- NEW STATE for Inline Editing ---
    const [editRowId, setEditRowId] = useState(null); // Stores the ID of the product being edited
    const [editFormData, setEditFormData] = useState({}); // Stores the data for the row being edited

    useEffect(() => {
        setIsLoading(true);
        setApiError(null);
        const timerId = setTimeout(() => {
          api.get(`/products?search=${searchTerm}`)
            .then(response => {
              setProducts(response.data);
            })
            .catch(err => {
              setApiError('Failed to fetch products. Please try again later.');
              setProducts([]);
            })
            .finally(() => {
              setIsLoading(false);
            });
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
        e.preventDefault(); // Added preventDefault for form submission
        const numQuantity = parseInt(quantity, 10);
        const isRemove = modalType === 'remove';
        if (isNaN(numQuantity) || numQuantity <= 0) {
          setFormError("Please enter a valid quantity greater than 0.");
          return;
        }
        if (isRemove && numQuantity > currentProduct.quantity) {
          setFormError(`Cannot remove more than the available stock (${currentProduct.quantity}).`);
          return;
        }
        const endpoint = isRemove ? 'removestock' : 'addstock';
        const body = isRemove ? { removeQuantity: numQuantity } : { addQuantity: numQuantity };
        try {
          const response = await api.patch(`/products/${currentProduct._id}/${endpoint}`, body);
          setProducts(products.map(p => p._id === currentProduct._id ? response.data : p));
          alert(`Stock ${isRemove ? 'removed' : 'added'} successfully!`);
          closeModal();
        } catch (err) {
          setFormError(err.response?.data?.error || `Failed to process stock change.`);
        }
    };

    const handleDelete = async (productId) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                await api.delete(`/products/${productId}`);
                setProducts(products.filter(p => p._id !== productId));
                alert('Product deleted successfully!');
            } catch (err) {
                alert('Failed to delete product.');
            }
        }
    }; 
    
    // FUNCTIONS for Inline Editing ---
    const handleEditClick = (product) => {
        setEditRowId(product._id);
        // Pre-fill the form data with the product's current values
        setEditFormData({
            name: product.name,        
            sku: product.sku, 
            price: product.price,
            quantity: product.quantity
        });
    };

    const handleCancelClick = () => {
        setEditRowId(null); // Exit edit mode
    };

    const handleEditFormChange = (e) => {
        const { name, value } = e.target;
        setEditFormData({
            ...editFormData,
            [name]: value
        });
    };

    const handleSaveClick = async (productId) => {
        try {
            const response = await api.patch(`/products/${productId}`, editFormData);
            // Update the product list with the new data from the server
            const updatedProducts = products.map((p) =>
                p._id === productId ? response.data : p
            );
            setProducts(updatedProducts);
            setEditRowId(null); // Exit edit mode on success
        } catch (err) {
            console.error("Failed to update product", err);
            alert("Error: Could not update product.");
        }
    };


    return (
        <Box sx={{ padding: { xs: 1, sm: 2, md: 3 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">
                    Inventory
                </Typography>
                <Button component={Link} to="/add-product" variant="contained" color="success" sx={{ whiteSpace: 'nowrap' }}>
                    + Add New Product
                </Button>
            </Box>

            <TextField
                fullWidth
                label="Search by name or SKU..."
                variant="outlined"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ mb: 3, backgroundColor: 'white' }}
            />

            {isLoading && <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}><CircularProgress /></Box>}
            {apiError && <Typography color="error">{apiError}</Typography>}
            
            {!isLoading && !apiError && (
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
                            {products.map((product) => (
                                <TableRow key={product._id} hover>
                                    
                                    {/* Name Cell: Show TextField in edit mode */}
                                    <TableCell>
                                        {editRowId === product._id ? (
                                            <TextField name="name" value={editFormData.name} onChange={handleEditFormChange} size="small" variant="standard" fullWidth />
                                        ) : ( product.name )}
                                    </TableCell>
                                    
                                    {/* SKU Cell: Show TextField in edit mode*/}
                                    <TableCell>
                                        {editRowId === product._id ? (
                                            <TextField name="sku" value={editFormData.sku} onChange={handleEditFormChange} size="small" variant="standard" fullWidth />
                                        ) : ( product.sku )}
                                    </TableCell>
                                    
                                    {/* Price Cell: Show TextField in edit mode */}
                                    <TableCell>
                                        {editRowId === product._id ? (
                                            <TextField type="number" name="price" value={editFormData.price} onChange={handleEditFormChange} size="small" variant="standard" fullWidth />
                                        ) : ( product.price.toFixed(2) )}
                                    </TableCell>
                                    
                                    {/* Quantity Cell: Show TextField in edit mode */}
                                    <TableCell>
                                        {editRowId === product._id ? (
                                            <TextField type="number" name="quantity" value={editFormData.quantity} onChange={handleEditFormChange} size="small" variant="standard" fullWidth />
                                        ) : ( product.quantity )}
                                    </TableCell>

                                    {/* Actions Cell: Show different buttons in edit mode */}
                                    <TableCell sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                        {editRowId === product._id ? (
                                            <>
                                                <Button onClick={() => handleSaveClick(product._id)} variant="contained" size="small" color="success">Save</Button>
                                                <Button onClick={handleCancelClick} variant="outlined" size="small">Cancel</Button>
                                            </>
                                        ) : (
                                            <>
                                                <Button onClick={() => openModal(product, 'add')} variant="contained" size="small">Add Stock</Button>
                                                <Button onClick={() => openModal(product, 'remove')} variant="outlined" size="small" color="warning">Remove</Button>
                                                <Button onClick={() => handleEditClick(product)} variant="outlined" size="small" color="info">Edit</Button>
                                                <Button onClick={() => handleDelete(product._id)} variant="outlined" size="small" color="error">Delete</Button>
                                            </>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <Modal
                open={modalIsOpen}
                onClose={closeModal}
                aria-labelledby="stock-modal-title"
                closeAfterTransition
            >
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
                                onChange={(e) => setQuantity(e.target.value)}
                                error={!!formError}
                                helperText={formError}
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

export default ProductListPage;