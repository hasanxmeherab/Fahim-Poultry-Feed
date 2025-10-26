import React, { useState, Suspense, lazy } from 'react';
import { Routes, Route, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// MUI Imports
import { Box, Typography, CircularProgress } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import InventoryIcon from '@mui/icons-material/Inventory';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import StorefrontIcon from '@mui/icons-material/Storefront';
import AssessmentIcon from '@mui/icons-material/Assessment';
import HistoryIcon from '@mui/icons-material/History';
import LogoutIcon from '@mui/icons-material/Logout';

// Core Components & Context
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage'; // Eager load login page
import './App.css';

// Loading Spinner for Lazy Components
const LoadingSpinner = () => (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
    </Box>
);

// Lazy load page components
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const CustomerListPage = lazy(() => import('./pages/CustomerListPage'));
const AddCustomerPage = lazy(() => import('./pages/AddCustomerPage'));
const EditCustomerPage = lazy(() => import('./pages/EditCustomerPage'));
const CustomerDetailsPage = lazy(() => import('./pages/CustomerDetailsPage'));
const ProductListPage = lazy(() => import('./pages/ProductListPage'));
const AddProductPage = lazy(() => import('./pages/AddProductPage'));
const EditProductPage = lazy(() => import('./pages/EditProductPage'));
const MakeSalePage = lazy(() => import('./pages/MakeSalePage'));
const ReceiptPage = lazy(() => import('./pages/ReceiptPage')); // Needs to handle ID param
const HistoryPage = lazy(() => import('./pages/HistoryPage'));
const SalesReportPage = lazy(() => import('./pages/SalesReportPage'));
const BatchReportPage = lazy(() => import('./pages/BatchReportPage'));
const WholesalePage = lazy(() => import('./pages/WholesalePage'));
const AddWholesaleBuyerPage = lazy(() => import('./pages/AddWholesaleBuyerPage'));
const EditWholesaleBuyerPage = lazy(() => import('./pages/EditWholesaleBuyerPage'));
const WholesaleBuyerDetailsPage = lazy(() => import('./pages/WholesaleBuyerDetailsPage'));
const AddWholesaleProductPage = lazy(() => import('./pages/AddWholesaleProductPage'));
const EditWholesaleProductPage = lazy(() => import('./pages/EditWholesaleProductPage'));
const ErrorPage = lazy(() => import('./pages/ErrorPage'));


// Sidebar Component
const Sidebar = ({ handleLogout, isLoggingOut }) => {
    return (
        <aside className="sidebar">
            <div className="sidebar-header"><h3>Fahim Poultry Feed</h3></div>
            <nav className="sidebar-nav">
                <ul>
                    {/* Add exact prop to home link if needed */}
                    <li><NavLink to="/" end><span className="icon"><DashboardIcon /></span><span>Dashboard</span></NavLink></li>
                    <li><NavLink to="/customers"><span className="icon"><PeopleAltIcon /></span><span>Customers</span></NavLink></li>
                    <li><NavLink to="/inventory"><span className="icon"><InventoryIcon /></span><span>Inventory</span></NavLink></li>
                    <li><NavLink to="/make-sale"><span className="icon"><ShoppingCartIcon /></span><span>Make Sale</span></NavLink></li>
                    <li><NavLink to="/wholesale"><span className="icon"><StorefrontIcon /></span><span>Wholesale</span></NavLink></li>
                    <li><NavLink to="/reports/sales"><span className="icon"><AssessmentIcon /></span><span>Sales Report</span></NavLink></li>
                    <li><NavLink to="/history"><span className="icon"><HistoryIcon /></span><span>History</span></NavLink></li>
                </ul>
            </nav>
            <div className="sidebar-footer">
                <button onClick={handleLogout} className="logout-button" disabled={isLoggingOut}>
                    {isLoggingOut ? (<CircularProgress size={22} color="inherit" />) : (<><span className="icon"><LogoutIcon /></span><span>Logout</span></>)}
                </button>
            </div>
        </aside>
    );
};

// Footer Component
const Footer = () => (
    <Box component="footer" sx={{ py: 1.5, px: 2, borderTop: '1px solid #e0e0e0', bgcolor: '#f7f9fc', textAlign: 'center', flexShrink: 0 }}>
        <Typography variant="body2" color="text.secondary"> © {new Date().getFullYear()} Fahim Poultry Feed | Developed by Meherab Hasan Fahim </Typography>
    </Box>
);

// Main App Structure
const AppContent = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { isAuthenticated, logout, isLoading: isAuthLoading } = useAuth();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try { await logout(); navigate('/login'); }
        catch (error) { console.error("Logout failed:", error); /* Add toast? */ }
        finally { setIsLoggingOut(false); }
    };

    // Determine layout visibility
    const isAuthPage = location.pathname === '/login';
    // Match /receipt/ followed by a 24-character hex string (MongoDB ObjectId)
    const isReceiptPage = /^\/receipt\/[a-fA-F0-9]{24}$/.test(location.pathname);
    const showLayout = isAuthenticated && !isAuthPage && !isReceiptPage;

    // Show loading spinner while auth state is being determined
    if (isAuthLoading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="app-layout">
            <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop theme="colored" />
            <div className="main-content-wrapper">
                {showLayout && <Sidebar handleLogout={handleLogout} isLoggingOut={isLoggingOut} />}
                {/* Apply fullscreen class conditionally */}
                <main className={showLayout ? "main-content" : "main-content-fullscreen"}>
                    <Suspense fallback={<LoadingSpinner />}>
                        <Routes>
                            {/* Public Routes */}
                            <Route path="/login" element={<LoginPage />} />
                            {/* --- UPDATED RECEIPT ROUTE to accept ID parameter --- */}
                            <Route path="/receipt/:transactionId" element={<ReceiptPage />} />
                            {/* Optional: Handle /receipt without a valid ID */}
                            <Route path="/receipt" element={<Typography sx={{ p: 3, textAlign: 'center', color: 'error.main' }}>Error: Receipt ID missing in URL.</Typography>} />
                            {/* --- END UPDATE --- */}

                            {/* Protected Routes */}
                            <Route element={<ProtectedRoute />}>
                                <Route path="/" element={<DashboardPage />} />
                                {/* Customer Routes */}
                                <Route path="/customers" element={<CustomerListPage />} />
                                <Route path="/add-customer" element={<AddCustomerPage />} />
                                <Route path="/edit-customer/:id" element={<EditCustomerPage />} />
                                <Route path="/customers/:id" element={<CustomerDetailsPage />} />
                                {/* Product Routes */}
                                <Route path="/inventory" element={<ProductListPage />} />
                                <Route path="/add-product" element={<AddProductPage />} />
                                <Route path="/edit-product/:id" element={<EditProductPage />} />
                                {/* Sale Route */}
                                <Route path="/make-sale" element={<MakeSalePage />} />
                                {/* History Route */}
                                <Route path="/history" element={<HistoryPage />} />
                                {/* Report Routes */}
                                <Route path="/reports/sales" element={<SalesReportPage />} />
                                <Route path="/reports/batch/:id" element={<BatchReportPage />} />
                                {/* Wholesale Routes */}
                                <Route path="/wholesale" element={<WholesalePage />} />
                                <Route path="/add-wholesale-buyer" element={<AddWholesaleBuyerPage />} />
                                <Route path="/edit-wholesale-buyer/:id" element={<EditWholesaleBuyerPage />} />
                                <Route path="/wholesale-buyers/:id" element={<WholesaleBuyerDetailsPage />} />
                                <Route path="/add-wholesale-product" element={<AddWholesaleProductPage />} />
                                <Route path="/edit-wholesale-product/:id" element={<EditWholesaleProductPage />} />
                            </Route>

                            {/* Catch-all 404 Route */}
                            <Route path="*" element={<ErrorPage />} />
                        </Routes>
                    </Suspense>
                </main>
            </div>
            {showLayout && <Footer />}
        </div>
    );
};

function App() {
    return <AppContent />;
}

export default App;

