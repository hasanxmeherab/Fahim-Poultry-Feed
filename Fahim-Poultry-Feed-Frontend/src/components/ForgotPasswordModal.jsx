import React, { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';

// Import Material-UI components
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    TextField,
    Typography,
    CircularProgress,
    Box
} from '@mui/material';

const ForgotPasswordModal = ({ isOpen, onRequestClose }) => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);

        try {
            await sendPasswordResetEmail(auth, email);
            setSuccess('Success! If a matching account exists, a password reset link has been sent to your email.');
            setError(''); // Clear any previous errors
        } catch (err) {
console.error("Firebase Error:", err);
            if (err.code === 'auth/invalid-email') {
                setError('Please enter a valid email address.');
            } else {
                setError('An error occurred. Please try again later.');
            }
        } finally {
            setIsLoading(false);
        }
    };
    
    // Reset state when the modal is closed
    const handleClose = () => {
        onRequestClose();
        setTimeout(() => {
            setError('');
            setSuccess('');
            setEmail('');
        }, 300); // Delay to allow closing animation
    };

    return (
        <Dialog open={isOpen} onClose={handleClose} PaperProps={{ component: 'form', onSubmit: handleSubmit }}>
            <DialogTitle sx={{ fontWeight: 'bold' }}>Reset Password</DialogTitle>
            <DialogContent>
                <DialogContentText sx={{ mb: 2 }}>
                    Enter your account's email address and we will send you a link to reset your password.
                </DialogContentText>
                <TextField
                    autoFocus
                    required
                    margin="dense"
                    id="email"
                    name="email"
                    label="Email Address"
                    type="email"
                    fullWidth
                    variant="outlined"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading || !!success} // Disable field if loading or on success
                />

                {/* Display Success or Error Messages */}
                {error && <Typography color="error" sx={{ mt: 1, fontSize: '0.9em' }}>{error}</Typography>}
                {success && <Typography color="success.main" sx={{ mt: 1, fontSize: '0.9em' }}>{success}</Typography>}

            </DialogContent>
            <DialogActions sx={{ p: '16px 24px' }}>
                <Button onClick={handleClose}>Cancel</Button>
                <Box sx={{ position: 'relative' }}>
                    <Button 
                        type="submit" 
                        variant="contained" 
                        disabled={isLoading || !email || !!success} // Disable if loading, no email, or on success
                    >
                        Send Reset Link
                    </Button>
                    {isLoading && (
                        <CircularProgress
                            size={24}
                            sx={{
                                color: 'primary.main',
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                marginTop: '-12px',
                                marginLeft: '-12px',
                            }}
                        />
                    )}
                </Box>
            </DialogActions>
        </Dialog>
    );
};

export default ForgotPasswordModal;