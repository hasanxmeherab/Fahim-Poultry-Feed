import React, { useState } from 'react';
import api from '../api/api';
import ForgotPasswordModal from '../components/ForgotPasswordModal';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from "firebase/auth";
// MUI Imports
import { Box, Paper, Typography, TextField, Button, Link, CircularProgress } from '@mui/material';
import BoltIcon from '@mui/icons-material/Bolt';

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false); 

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      // Use Firebase to sign in
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      
      // Get the Firebase ID Token
      const idToken = await userCredential.user.getIdToken();
      
      // Pass the token to our AuthContext
      login(idToken);
      
      navigate('/');
    } catch (err) {
      console.error("Firebase Login Error:", err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Invalid email or password.');
      } else {
        setError('An error occurred. Please try again.');
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
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh', 
          bgcolor: '#f7f9fc'
        }}
      >
        <Paper 
          elevation={4}
          sx={{ 
            p: { xs: 3, sm: 4 }, 
            width: '100%', 
            maxWidth: '400px', 
            textAlign: 'center',
            borderRadius: '16px',
          }}
        >
          <Box 
            sx={{
              mx: 'auto',
              mb: 2,
              width: 60,
              height: 60,
              borderRadius: '50%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              bgcolor: 'primary.lightest',
              color: 'primary.main'
            }}
          >
            <BoltIcon sx={{ fontSize: 32 }} />
          </Box>

          <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 1 }}>
            Fahim Poultry Feed
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Admin Login
          </Typography>

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              margin="normal"
              id="email"
              name="email"
              label="Email Address"
              type="email"
              onChange={handleChange}
              required
            />
            <TextField
              fullWidth
              margin="normal"
              id="password"
              name="password"
              label="Password"
              type="password"
              onChange={handleChange}
              required
            />
            
            {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}
            
            <Button 
              type="submit" 
              fullWidth 
              variant="contained"
              size="large"
              color="primary"
              sx={{ mt: 2, py: 1.5, fontWeight: 600 }}
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
            >
              Forgot Password?
            </Link>
          </Box>
        </Paper>
        <Box
          sx={{
            position: 'absolute',
            bottom: '2rem',
            width: '100%',
            textAlign: 'center',
          }}
        >
          <Typography variant="body2" color="text.secondary">
            © 2025 Fahim Poultry Feed | All rights reserved
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