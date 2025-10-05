// frontend/src/pages/LoginPage.jsx

import React, { useState } from 'react';
import api from '../api/api';
import ForgotPasswordModal from '../components/ForgotPasswordModal'; // Import the new component

const LoginPage = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false); // State to control the modal

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
        const response = await api.post('/users/login', formData);
        localStorage.setItem('userToken', response.data.token);
        window.location.href = '/';
    } catch (err) {
        setError('Invalid username or password.');
    }
  };

  return (
    <>
      <style>{`
        .login-page-container { display: flex; justify-content: center; align-items: center; min-height: 100vh; width: 100%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f7f9fc; }
        .login-card { width: 100%; max-width: 400px; background: #ffffff; padding: 40px 30px; border-radius: 16px; box-shadow: 0 20px 50px rgba(0, 8, 20, 0.1); text-align: center; border: 1px solid #e5e7eb; }
        .login-icon { width: 60px; height: 60px; margin: 0 auto 20px; background-color: #e6f4ea; border-radius: 50%; display: flex; justify-content: center; align-items: center; }
        .login-icon svg { width: 32px; height: 32px; color: #27ae60; }
        .login-header { margin-bottom: 30px; }
        .login-header h1 { font-size: 1.8rem; color: #1a2c3a; margin: 0 0 8px 0; border: none; font-weight: 600; }
        .login-header p { font-size: 1rem; color: #6b7280; margin: 0; }
        .input-group { margin-bottom: 20px; text-align: left; }
        .input-group label { display: block; font-size: 0.875rem; color: #4b5563; margin-bottom: 8px; font-weight: 500; }
        .input-group input { width: 100%; padding: 12px 15px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 1rem; transition: border-color 0.2s, box-shadow 0.2s; box-sizing: border-box; }
        .input-group input:focus { outline: none; border-color: #27ae60; box-shadow: 0 0 0 3px rgba(39, 174, 96, 0.1); }
        .login-button { width: 100%; padding: 14px; background: #27ae60; color: white; border: none; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: background-color 0.2s, transform 0.1s; }
        .login-button:hover { background: #229954; transform: translateY(-2px); }
        .login-button:active { transform: translateY(0); }
        .error-message { color: #ef4444; text-align: center; margin-top: 15px; font-size: 0.875rem; }
        .forgot-password { display: block; text-align: right; margin-top: 12px; font-size: 0.875rem; color: #27ae60; text-decoration: none; cursor: pointer; font-weight: 500; }
        .forgot-password:hover { text-decoration: underline; }
      `}</style>
      
      <ForgotPasswordModal 
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
      />

      <div className="login-page-container">
        <div className="login-card">
          <div className="login-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
          </div>
          <div className="login-header">
            <h1>Fahim Poultry Feed</h1>
            <p>Admin Login</p>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="username">Username</label>
              <input id="username" type="text" name="username" required onChange={handleChange} />
            </div>
            <div className="input-group">
              <label htmlFor="password">Password</label>
              <input id="password" type="password" name="password" required onChange={handleChange} />
            </div>
            {error && <p className="error-message">{error}</p>}
            <button type="submit" className="login-button">Log In</button>
            <a onClick={() => setIsModalOpen(true)} className="forgot-password">
              Forgot Password?
            </a>
          </form>
        </div>
      </div>
    </>
  );
};

export default LoginPage;