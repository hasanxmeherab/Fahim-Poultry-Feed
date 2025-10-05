import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
    const token = localStorage.getItem('userToken');
    // If token exists, render the child routes (Outlet). Otherwise, navigate to login.
    return token ? <Outlet /> : <Navigate to="/login" />;
};

export default ProtectedRoute;