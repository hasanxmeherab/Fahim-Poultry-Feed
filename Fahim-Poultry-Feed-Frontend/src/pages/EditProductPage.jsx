import React, { useState, useEffect } from 'react';
import api from '../api/api.js';
import { useParams, useNavigate } from 'react-router-dom';

const EditProductPage = () => {
  const { id } = useParams(); // Gets the product ID from the URL
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ name: '', sku: '', price: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch the specific product's data when the page loads
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await api.get(`/products/${id}`);
        setFormData(response.data);
      } catch (err) {
        setError('Failed to fetch product data.');
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
      alert('Product updated successfully!');
      navigate('/inventory'); // Go back to the inventory list
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update product.');
    }
  };

  if (isLoading) return <p>Loading product details...</p>;
  if (error && !formData.name) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div>
      <h1>Edit Product</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Product Name:</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} required />
        </div>
        <div>
          <label>SKU:</label>
          <input type="text" name="sku" value={formData.sku} onChange={handleChange} required />
        </div>
        <div>
          <label>Price (TK):</label>
          <input type="number" name="price" value={formData.price} onChange={handleChange} required min="0" step="0.01" />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" className="button-primary">Save Changes</button>
      </form>
    </div>
  );
};

export default EditProductPage;