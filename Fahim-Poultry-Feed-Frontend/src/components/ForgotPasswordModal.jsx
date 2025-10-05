// frontend/src/components/ForgotPasswordModal.jsx

import React, { useState } from 'react';
import Modal from 'react-modal';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';

// The modalStyles object is now defined only ONCE, outside the component.
const modalStyles = {
    content: {
        top: '50%', left: '50%', right: 'auto', bottom: 'auto',
        marginRight: '-50%', transform: 'translate(-50%, -50%)',
        width: '450px', borderRadius: '12px', padding: '30px'
    }
};

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
        } catch (err) {
            if (err.code === 'auth/invalid-email') {
                setError('Please enter a valid email address.');
            } else {
                setError('An error occurred. Please try again later.');
            }
            console.error("Firebase Error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    // The console.log has been removed from here.

    return (
        <Modal isOpen={isOpen} onRequestClose={onRequestClose} style={modalStyles} contentLabel="Forgot Password Modal">
            <h2>Reset Password</h2>
            <p>Enter your account's email address and we will send you a link to reset your password.</p>
            <form onSubmit={handleSubmit}>
                <div className="input-group">
                    <label htmlFor="email">Email</label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="you@example.com"
                        style={{width: '100%', boxSizing: 'border-box'}}
                    />
                </div>
                {error && <p style={{ color: 'red', fontSize: '0.9em' }}>{error}</p>}
                {success && <p style={{ color: 'green', fontSize: '0.9em' }}>{success}</p>}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                    <button type="button" onClick={onRequestClose} className="button-warning">Cancel</button>
                    <button type="submit" className="button-primary" disabled={isLoading}>
                        {isLoading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default ForgotPasswordModal;