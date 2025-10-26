import React, { useState } from 'react';
// import api from '../api/api'; // api is not used in this specific file
import ForgotPasswordModal from '../components/ForgotPasswordModal';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from "firebase/auth";
import { TypeAnimation } from 'react-type-animation';

// MUI Imports
import { Box, Paper, Typography, TextField, Button, Link, CircularProgress, Alert } from '@mui/material';
import LockOpenIcon from '@mui/icons-material/LockOpen';

const LoginPage = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (error) setError(''); // Clear error on input change
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); // Clear previous errors

        // --- ADDED VALIDATION HERE ---
        if (!formData.email.trim() && !formData.password.trim()) {
            setError('Email and Password are required.');
            return; // Stop submission
        }
        if (!formData.email.trim()) {
            setError('Email Address is required.');
            return; // Stop submission
        }
        if (!formData.password.trim()) {
            setError('Password is required.');
            return; // Stop submission
        }
        // --- END VALIDATION ---

        setIsLoading(true); // Start loading AFTER validation passes
        try {
            const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
            const idToken = await userCredential.user.getIdToken();
            login(idToken);
            navigate('/');
        } catch (err) {
            console.error("Firebase Login Error:", err);
            if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
                setError('Invalid email or password. Please try again.');
            } else if (err.code === 'auth/too-many-requests') {
                 setError('Access temporarily disabled due to too many failed login attempts. Please reset your password or try again later.');
            }
             else {
                // Keep this generic error for actual Firebase/network issues
                setError('Login failed. Please check your connection and try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <ForgotPasswordModal
                isOpen={isModalOpen}
                onRequestClose={() => setIsModalOpen(false)}
            />

            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '100vh',
                    bgcolor: 'grey.100',
                    p: 2,
                }}
            >
                <Paper
                    elevation={6}
                    sx={{
                        p: { xs: 3, sm: 5 },
                        width: '100%',
                        maxWidth: '420px',
                        textAlign: 'center',
                        borderRadius: '12px',
                        mb: 4,
                    }}
                >
                    <Box sx={{ mb: 3 }}>
                        <LockOpenIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                        {/* Typography component to hold animation */}
                        <Typography
                            variant="h4"
                            component="h1"
                            sx={{ // Apply gradient styles using sx prop
                                fontWeight: 700,
                                mb: 1,
                                minHeight: '48px', /* Reserve space */
                                // CSS Gradient
                                backgroundImage: 'linear-gradient(to top left, #1e293b, #6366f1, #71717a)', // slate-800, violet-500, zinc-400
                                // Apply background clip
                                backgroundClip: 'text',
                                WebkitBackgroundClip: 'text', // Vendor prefix for compatibility
                                // Make text transparent to show gradient
                                color: 'transparent',
                            }}
                        >
                            <TypeAnimation
                                sequence={[
                                    'Fahim Poultry Feed',
                                    2000,
                                ]}
                                wrapper="span"
                                cursor={false} // Hide cursor
                                repeat={0}     // Run once
                                style={{ display: 'inline-block' }}
                            />
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            Admin Login Portal
                        </Typography>
                    </Box>

                    {/* Login Form */}
                    <Box component="form" onSubmit={handleSubmit} noValidate>
                        <TextField
                            fullWidth
                            margin="normal"
                            id="email"
                            name="email"
                            label="Email Address"
                            type="email"
                            autoComplete='email'
                            value={formData.email}
                            onChange={handleChange}
                            required
                            variant="outlined"
                        />
                        <TextField
                            fullWidth
                            margin="normal"
                            id="password"
                            name="password"
                            label="Password"
                            type="password"
                            autoComplete="current-password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            variant="outlined"
                        />

                        {/* Error Alert */}
                        {error && (
                            <Alert severity="error" sx={{ mt: 2, textAlign: 'left' }}>
                                {error}
                            </Alert>
                        )}

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            size="large"
                            color="primary"
                            sx={{ mt: 3, py: 1.5, fontWeight: 600, borderRadius: '8px' }}
                            disabled={isLoading}
                        >
                            {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Log In'}
                        </Button>

                        <Link
                            component="button"
                            type="button"
                            variant="body2"
                            onClick={() => setIsModalOpen(true)}
                            sx={{ display: 'block', textAlign: 'right', mt: 2, fontWeight: 500 }}
                            disabled={isLoading}
                        >
                            Forgot Password?
                        </Link>
                    </Box>
                </Paper>

                {/* Footer */}
                <Box
                    sx={{
                        width: '100%',
                        textAlign: 'center',
                        position: 'relative',
                        bottom: 0,
                        py: 2
                    }}
                >
                    <Typography variant="body2" color="text.secondary">
                        © {new Date().getFullYear()} Fahim Poultry Feed | All rights reserved
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Developed by Meherab Hasan Fahim
                    </Typography>
                </Box>
            </Box>
        </>
    );
};

export default LoginPage;