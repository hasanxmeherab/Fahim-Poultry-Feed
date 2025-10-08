import React, { useState, useEffect } from 'react';
import api from '../api/api.js';
import { useParams, useNavigate } from 'react-router-dom';
import { showErrorToast, showSuccessToast } from '../utils/notifications.js';

// MUI Imports
import { Box, Button, TextField, Typography, Paper, CircularProgress } from '@mui/material';

const EditProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', sku: '', price: '' });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await api.get(`/products/${id}`);
        setFormData(response.data);
      } catch (err) {
        showErrorToast(err, 'Failed to fetch product data.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/products/${id}`, formData);
      showSuccessToast('Product updated successfully!');
      
      setTimeout(() => {
        navigate('/inventory');
      }, 1000); // 1-second delay for toast visibility

    } catch (err) {
      showErrorToast(err, 'Failed to update product.');
    }
  };

  if (isLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ maxWidth: '600px', margin: 'auto', p: 3 }}>
        <Paper component="form" onSubmit={handleSubmit} noValidate sx={{ p: 3 }}>
            <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
                Edit Product
            </Typography>
            
            <TextField
                fullWidth
                label="Product Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                sx={{ mb: 2 }}
            />
            
            <TextField
                fullWidth
                label="SKU (Stock Keeping Unit)"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                required
                sx={{ mb: 2 }}
            />

            <TextField
                fullWidth
                label="Price (TK)"
                name="price"
                type="number"
                value={formData.price}
                onChange={handleChange}
                required
                sx={{ mb: 2 }}
            />
            
            <Button type="submit" variant="contained" fullWidth>
                Save Changes
            </Button>
        </Paper>
    </Box>
  );
};

export default EditProductPage;