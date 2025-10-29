import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { showErrorToast, showSuccessToast } from '../utils/notifications';
import { modalStyle } from '../../styles/commonStyles.js';
// MUI Imports
import { 
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button,
    CircularProgress, Box, Typography, Select, MenuItem, FormControl, InputLabel 
} from '@mui/material';

const CreateUserModal = ({ isOpen, onClose, onUserCreated }) => {
    const [formData, setFormData] = useState({ 
        email: '', 
        password: '', 
        displayName: '', 
        role: 'clerk' // Default new users to 'clerk'
    });
    const [formErrors, setFormErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset state on open/close
    useEffect(() => {
        if (isOpen) {
            setFormData({ email: '', password: '', displayName: '', role: 'clerk' });
            setFormErrors({});
        }
    }, [isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
        if (formErrors.general) setFormErrors(prev => ({ ...prev, general: '' }));
    };

    const validateForm = () => {
        const errors = {};
        if (!formData.email.trim()) errors.email = 'Email is required.';
        // Firebase Auth requires a minimum of 6 characters for the password
        if (!formData.password.trim() || formData.password.length < 6) errors.password = 'Password must be at least 6 characters.';
        if (!formData.displayName.trim()) errors.displayName = 'Name is required.';
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            // POST to the protected /api/users route (backend handles Firebase creation)
            const response = await api.post('/users', formData);
            
            showSuccessToast(`User ${response.data.displayName} created successfully.`);
            onUserCreated(); // Callback to refresh the user list in the parent (UserManagementPage)
            onClose();

        } catch (err) {
            const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Failed to create user.';
            setFormErrors(prev => ({ ...prev, general: errorMsg }));
            showErrorToast(err, 'User Creation Failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog 
            open={isOpen} 
            onClose={() => !isSubmitting && onClose()} 
            PaperProps={{ 
                component: 'form', 
                onSubmit: handleSubmit,
                sx: modalStyle // Apply the common modal style here
            }}
        >
            <DialogTitle sx={{ fontWeight: 'bold' }}>Create New User Account</DialogTitle>
            <DialogContent>
                <Box sx={{ minWidth: 350, pt: 1 }}>
                    <TextField
                        fullWidth autoFocus margin="dense" name="displayName" label="Full Name"
                        value={formData.displayName} onChange={handleChange} required
                        error={!!formErrors.displayName} helperText={formErrors.displayName || ''}
                        disabled={isSubmitting} sx={{ mb: 2 }}
                    />
                    <TextField
                        fullWidth margin="dense" name="email" label="Email Address" type="email"
                        value={formData.email} onChange={handleChange} required
                        error={!!formErrors.email} helperText={formErrors.email || ''}
                        disabled={isSubmitting} sx={{ mb: 2 }}
                    />
                    <TextField
                        fullWidth margin="dense" name="password" label="Temporary Password" type="password"
                        value={formData.password} onChange={handleChange} required
                        error={!!formErrors.password} helperText={formErrors.password || 'Must be at least 6 characters.'}
                        disabled={isSubmitting} sx={{ mb: 2 }}
                    />
                    
                    <FormControl fullWidth size="small" disabled={isSubmitting}>
                        <InputLabel>Initial Role</InputLabel>
                        <Select
                            name="role" label="Initial Role" value={formData.role}
                            onChange={handleChange}
                        >
                            <MenuItem value="clerk">Manager</MenuItem>
                            <MenuItem value="viewer">Viewer</MenuItem>
                            <MenuItem value="admin">Admin</MenuItem>
                        </Select>
                    </FormControl>

                    {formErrors.general && <Typography color="error" sx={{ mt: 2 }}>{formErrors.general}</Typography>}
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: '16px 24px' }}>
                <Button onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                <Button type="submit" variant="contained" disabled={isSubmitting}>
                    {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Create User'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CreateUserModal;