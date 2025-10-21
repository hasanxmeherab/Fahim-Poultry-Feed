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
import LoginPage from './pages/LoginPage';
import './App.css';

// --- Create a loading component for Suspense ---
const LoadingSpinner = () => (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
    </Box>
);

// --- Lazily import all page components ---
const HomePage = lazy(() => import('./pages/DashboardPage'));
const CustomerDetailsPage = lazy(() => import('./pages/CustomerDetailsPage'));
const SalesReportPage = lazy(() => import('./pages/SalesReportPage'));
const EditProductPage = lazy(() => import('./pages/EditProductPage'));
const EditCustomerPage = lazy(() => import('./pages/EditCustomerPage'));
const CustomerListPage = lazy(() => import('./pages/CustomerListPage'));
const AddCustomerPage = lazy(() => import('./pages/AddCustomerPage'));
const ProductListPage = lazy(() => import('./pages/ProductListPage'));
const AddProductPage = lazy(() => import('./pages/AddProductPage'));
const MakeSalePage = lazy(() => import('./pages/MakeSalePage'));
const ReceiptPage = lazy(() => import('./pages/ReceiptPage'));
const HistoryPage = lazy(() => import('./pages/HistoryPage'));
const BatchReportPage = lazy(() => import('./pages/BatchReportPage'));
const WholesalePage = lazy(() => import('./pages/WholesalePage'));
const AddWholesaleBuyerPage = lazy(() => import('./pages/AddWholesaleBuyerPage'));
const EditWholesaleBuyerPage = lazy(() => import('./pages/EditWholesaleBuyerPage'));
const WholesaleBuyerDetailsPage = lazy(() => import('./pages/WholesaleBuyerDetailsPage'));
const AddWholesaleProductPage = lazy(() => import('./pages/AddWholesaleProductPage'));
const EditWholesaleProductPage = lazy(() => import('./pages/EditWholesaleProductPage'));
const ErrorPage = lazy(() => import('./pages/ErrorPage'));


// --- Corrected Sidebar component definition ---
const Sidebar = ({ handleLogout, isLoggingOut }) => { // Now accepts isLoggingOut
    return (
        <aside className="sidebar">
            <div className="sidebar-header"><h3>Fahim Poultry Feed</h3></div>
            <nav className="sidebar-nav">
                <ul>
                    <li><NavLink to="/"><span className="icon"><DashboardIcon /></span><span>Dashboard</span></NavLink></li>
                    <li><NavLink to="/customers"><span className="icon"><PeopleAltIcon /></span><span>Customers</span></NavLink></li>
                    <li><NavLink to="/inventory"><span className="icon"><InventoryIcon /></span><span>Inventory</span></NavLink></li>
                    <li><NavLink to="/make-sale"><span className="icon"><ShoppingCartIcon /></span><span>Make a Sale</span></NavLink></li>
                    <li><NavLink to="/wholesale"><span className="icon"><StorefrontIcon /></span><span>Wholesale</span></NavLink></li>
                    <li><NavLink to="/reports/sales"><span className="icon"><AssessmentIcon /></span><span>Sales Report</span></NavLink></li>
                    <li><NavLink to="/history"><span className="icon"><HistoryIcon /></span><span>History</span></NavLink></li>
                </ul>
            </nav>
            <div className="sidebar-footer">
                <button
                    onClick={handleLogout}
                    className="logout-button"
                    disabled={isLoggingOut} // Button is disabled when logging out
                >
                    {isLoggingOut ? (
                        <CircularProgress size={22} color="inherit" /> // Show spinner
                    ) : (
                        <>
                            <span className="icon"><LogoutIcon /></span>
                            <span>Logout</span>
                        </>
                    )}
                </button>
            </div>
        </aside>
    );
};

const Footer = () => {
    return (
        <Box
            component="footer"
            sx={{
                py: 2,
                px: { xs: 2, md: '15%' },
                borderTop: '1px solid #e0e0e0',
                bgcolor: '#f7f9fc',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 2,
                flexShrink: 0
            }}
        >
            <Typography variant="body2" color="text.secondary">
                © 2025 Fahim Poultry Feed | All rights reserved
            </Typography>
            <Typography variant="body2" color="text.secondary">
                Developed by Meherab Hasan Fahim
            </Typography>
        </Box>
    );
};

const AppContent = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { isAuthenticated, logout } = useAuth();
    const [isLoggingOut, setIsLoggingOut] = useState(false); // State to control the spinner

    const handleLogout = async () => {
        setIsLoggingOut(true); // Start spinner
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error("Logout failed:", error);
            // Optionally show an error toast here if needed
        } finally {
            setIsLoggingOut(false); // Stop spinner
        }
    };

    const isAuthPage = location.pathname === '/login';
    const isReceiptPage = location.pathname === '/receipt';
    // Logic to determine if the 404 page should show full layout (can be refined)
    const isErrorPage = ![
        '/', '/login', '/receipt', '/customers', '/add-customer', '/inventory', '/add-product',
        '/make-sale', '/wholesale', '/add-wholesale-buyer', '/add-wholesale-product',
        '/reports/sales', '/history'
    ].some(path => location.pathname === path) && // Exact matches
        !/^\/edit-customer\/.+$/.test(location.pathname) && // Regex for edit customer
        !/^\/customers\/.+$/.test(location.pathname) && // Regex for customer details
        !/^\/edit-product\/.+$/.test(location.pathname) && // Regex for edit product
        !/^\/reports\/batch\/.+$/.test(location.pathname) && // Regex for batch report
        !/^\/edit-wholesale-buyer\/.+$/.test(location.pathname) && // Regex for edit wholesale buyer
        !/^\/wholesale-buyers\/.+$/.test(location.pathname) && // Regex for wholesale buyer details
        !/^\/edit-wholesale-product\/.+$/.test(location.pathname); // Regex for edit wholesale product

    const showLayout = isAuthenticated && !isAuthPage && !isReceiptPage && !isErrorPage;

    return (
        <div className="app-layout">
            <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />

            <div className="main-content-wrapper">
                {/* Pass isLoggingOut state to Sidebar */}
                {showLayout && <Sidebar handleLogout={handleLogout} isLoggingOut={isLoggingOut} />}
                <div className={showLayout ? "main-content" : "main-content-fullscreen"}>
                    <Suspense fallback={<LoadingSpinner />}>
                        <Routes>
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/receipt" element={<ReceiptPage />} />

                            <Route element={<ProtectedRoute />}>
                                <Route path="/" element={<HomePage />} />
                                <Route path="/customers" element={<CustomerListPage />} />
                                <Route path="/add-customer" element={<AddCustomerPage />} />
                                <Route path="/edit-customer/:id" element={<EditCustomerPage />} />
                                <Route path="/customers/:id" element={<CustomerDetailsPage />} />
                                <Route path="/inventory" element={<ProductListPage />} />
                                <Route path="/add-product" element={<AddProductPage />} />
                                <Route path="/edit-product/:id" element={<EditProductPage />} />
                                <Route path="/make-sale" element={<MakeSalePage />} />
                                <Route path="/history" element={<HistoryPage />} />
                                <Route path="/reports/sales" element={<SalesReportPage />} />
                                <Route path="/reports/batch/:id" element={<BatchReportPage />} />
                                <Route path="/wholesale" element={<WholesalePage />} />
                                <Route path="/add-wholesale-buyer" element={<AddWholesaleBuyerPage />} />
                                <Route path="/edit-wholesale-buyer/:id" element={<EditWholesaleBuyerPage />} />
                                <Route path="/wholesale-buyers/:id" element={<WholesaleBuyerDetailsPage />} />
                                <Route path="/add-wholesale-product" element={<AddWholesaleProductPage />} />
                                <Route path="/edit-wholesale-product/:id" element={<EditWholesaleProductPage />} />
                                {/* Error route moved outside */}
                            </Route>
                             {/* Catch-all 404 Route */}
                             <Route path="*" element={<ErrorPage />} />
                        </Routes>
                    </Suspense>
                </div>
            </div>
            {showLayout && <Footer />}
        </div>
    );
};

function App() {
    return <AppContent />;
}

export default App;