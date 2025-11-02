import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';
import { auth } from '../firebase';
import { updateProfile } from "firebase/auth";

// --- REMOVED FIREBASE STORAGE IMPORTS ---

// MUI Imports
import {
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button,
    CircularProgress, Box, Avatar, IconButton, Typography, FormHelperText
} from '@mui/material';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import AccountCircle from '@mui/icons-material/AccountCircle';
import { showErrorToast, showSuccessToast } from '../utils/notifications';


// NOTE: Reading key from environment variable
const IMAGEBB_API_KEY = import.meta.env.VITE_IMAGEBB_API_KEY;


const ProfileEditModal = ({ isOpen, onClose }) => {
    const { user, refreshUserData } = useAuth();
    const [displayName, setDisplayName] = useState('');
    // Store the actual File object for FormData conversion
    const [profilePicFile, setProfilePicFile] = useState(null); 
    const [profilePicPreview, setProfilePicPreview] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    // Pre-fill form when modal opens or user changes
    useEffect(() => {
        if (user) {
            setDisplayName(user.displayName || '');
            setProfilePicPreview(user.photoURL || null); 
            setProfilePicFile(null); 
            setErrors({});
        }
    }, [user, isOpen]);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { 
                setErrors({ ...errors, photo: 'File size should not exceed 2MB.' });
                setProfilePicFile(null);
                setProfilePicPreview(null);
                return;
            }
            
            // --- FIX: Store the File object directly ---
            setProfilePicFile(file); 
            // --- END FIX ---
            
            setProfilePicPreview(URL.createObjectURL(file)); // Show preview
            setErrors({ ...errors, photo: '' });
        } else {
             setProfilePicFile(null);
             setProfilePicPreview(user?.photoURL || null); // Revert preview to existing URL
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!displayName.trim()) {
            newErrors.name = 'Name cannot be empty.';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSubmitting(true);
        setErrors({});
        let photoURL = user?.photoURL; // Keep existing URL unless new file is uploaded

        try {
            // 1. Upload new picture to ImageBB using FormData (CORS fix)
            if (profilePicFile) {
                console.log('Attempting ImageBB upload via FormData...');
                
                const formData = new FormData();
                // We append the actual File object here. Axios/browser handles the multipart/form-data headers.
                formData.append('image', profilePicFile);

                const uploadResponse = await axios.post(
                    `https://api.imgbb.com/1/upload?key=${IMAGEBB_API_KEY}`,
                    formData // Sending FormData automatically sets the correct Content-Type header
                );

                if (uploadResponse.data.success) {
                    photoURL = uploadResponse.data.data.url; // Get the public image URL
                    console.log('ImageBB Upload Successful, URL:', photoURL);
                } else {
                    throw new Error(uploadResponse.data.error?.message || 'ImageBB upload failed with no specific error.');
                }
            }

            // 2. Update backend (sends name and potentially new photoURL)
            await api.patch('/profile', { 
                displayName: displayName.trim(),
                photoURL: photoURL 
            });

            // 3. Update Firebase Auth profile on client-side (for immediate UI update)
            if (auth.currentUser) {
                 await updateProfile(auth.currentUser, {
                     displayName: displayName.trim(),
                     photoURL: photoURL
                 });
            }

            showSuccessToast('Profile updated successfully!');
            await refreshUserData();
            onClose();

        } catch (err) {
            console.error("Profile Update Error:", err);
            
            // Handle specific upload errors or API errors
            const errorMessage = err.message || err.response?.data?.error || 'Failed to update profile.';
            showErrorToast({ message: errorMessage }, 'Update Failed');
            
            setErrors({ general: errorMessage });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onClose={() => !isSubmitting && onClose()} PaperProps={{ component: 'form', onSubmit: handleSubmit }}>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                    <Avatar
                        src={profilePicPreview || undefined}
                        sx={{ width: 100, height: 100, mb: 1 }}
                    >
                        {/* Fallback Initial */}
                        {displayName ? displayName.charAt(0).toUpperCase() : <AccountCircle />}
                    </Avatar>
                    <Button
                        variant="outlined"
                        component="label"
                        size="small"
                        startIcon={<PhotoCamera />}
                        disabled={isSubmitting}
                    >
                        Change Picture
                        <input
                            type="file"
                            hidden
                            accept="image/png, image/jpeg"
                            onChange={handleFileChange}
                        />
                    </Button>
                    {errors.photo && <FormHelperText error>{errors.photo}</FormHelperText>}
                </Box>
                <TextField
                    autoFocus
                    required
                    margin="dense"
                    id="displayName"
                    label="Admin Name"
                    type="text"
                    fullWidth
                    variant="outlined"
                    value={displayName}
                    onChange={(e) => {
                        setDisplayName(e.target.value);
                        if (errors.name) setErrors({ ...errors, name: '' });
                    }}
                    error={!!errors.name}
                    helperText={errors.name || ''}
                    disabled={isSubmitting}
                />
                 {errors.general && <Typography color="error" sx={{ mt: 1, fontSize: '0.9em' }}>{errors.general}</Typography>}
            </DialogContent>
            <DialogActions sx={{ p:'16px 24px'}}>
                <Button onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                <Button type="submit" variant="contained" disabled={isSubmitting}>
                    {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Save Changes'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ProfileEditModal;
