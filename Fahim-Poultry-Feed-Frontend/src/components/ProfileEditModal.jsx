import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/api'; // For sending updates to your backend
import { auth } from '../firebase'; // For potential direct Firebase updates if needed
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage"; // Firebase Storage
import { updateProfile } from "firebase/auth"; // To update Firebase Auth profile client-side (optional but good)


// MUI Imports
import {
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button,
    CircularProgress, Box, Avatar, IconButton, Typography, FormHelperText
} from '@mui/material';
// --- ADDED AccountCircle HERE ---
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import AccountCircle from '@mui/icons-material/AccountCircle';
// --- END ADDITION ---
import { showErrorToast, showSuccessToast } from '../utils/notifications';

// Initialize Firebase Storage (Do this in firebase.js ideally)
const storage = getStorage(); // Assumes firebase app is initialized

const ProfileEditModal = ({ isOpen, onClose }) => {
    const { user, refreshUserData } = useAuth();
    const [displayName, setDisplayName] = useState('');
    const [profilePicFile, setProfilePicFile] = useState(null);
    const [profilePicPreview, setProfilePicPreview] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    // Pre-fill form when modal opens or user changes
    useEffect(() => {
        if (user) {
            setDisplayName(user.displayName || '');
            setProfilePicPreview(user.photoURL || null); // Show current pic
            setProfilePicFile(null); // Reset file input
            setErrors({}); // Clear errors
        }
    }, [user, isOpen]);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // Example: Limit to 2MB
                setErrors({ ...errors, photo: 'File size should not exceed 2MB.' });
                return;
            }
            setProfilePicFile(file);
            setProfilePicPreview(URL.createObjectURL(file)); // Show preview
            setErrors({ ...errors, photo: '' }); // Clear error
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
            // 1. Upload new picture to Firebase Storage (if selected)
            if (profilePicFile) {
                const storageRef = ref(storage, `profilePictures/${user.uid}/${profilePicFile.name}`);
                const snapshot = await uploadBytes(storageRef, profilePicFile);
                photoURL = await getDownloadURL(snapshot.ref);
                console.log('File uploaded, URL:', photoURL);
            }

            // 2. Update backend (sends name and potentially new photoURL)
            // Backend should handle updating Firebase Auth user record
            await api.patch('/profile', { // Assuming endpoint is /api/profile
                displayName: displayName.trim(),
                photoURL: photoURL // Send current or new URL
            });

            // 3. (Optional but recommended) Update Firebase Auth profile on client-side too
            // This makes the UI update faster without waiting for token refresh/onAuthStateChanged
            if (auth.currentUser) {
                 await updateProfile(auth.currentUser, {
                     displayName: displayName.trim(),
                     photoURL: photoURL
                 });
            }

            showSuccessToast('Profile updated successfully!');
            await refreshUserData(); // Try to refresh context data including claims
            onClose(); // Close modal

        } catch (err) {
            console.error("Profile Update Error:", err);
            // Handle specific storage errors if needed
            if (err.code?.startsWith('storage/')) {
                 showErrorToast(err, 'Failed to upload profile picture.');
            } else {
                 showErrorToast(err, 'Failed to update profile.');
            }
            setErrors({ general: err.response?.data?.error || err.message || 'Update failed.' });
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
                        src={profilePicPreview || undefined} // Use preview or current URL
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