import React, { useState, Suspense, lazy } from 'react';
import { Routes, Route, NavLink, useNavigate, useLocation, Link as RouterLink } from 'react-router-dom'; // Added RouterLink alias
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// MUI Imports
import { Box, Typography, CircularProgress, AppBar, Toolbar, IconButton, Menu, MenuItem, Avatar, Button, Link as MuiLink } from '@mui/material'; // Added MuiLink
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import InventoryIcon from '@mui/icons-material/Inventory';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import StorefrontIcon from '@mui/icons-material/Storefront';
import AssessmentIcon from '@mui/icons-material/Assessment';
import HistoryIcon from '@mui/icons-material/History';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircle from '@mui/icons-material/AccountCircle';

// Core Components & Context
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import './App.css';
import ProfileEditModal from './components/ProfileEditModal';


// Loading Spinner for Lazy Components (Unchanged)
const LoadingSpinner = () => (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
    </Box>
);


// Lazy load page components (Unchanged)
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const CustomerListPage = lazy(() => import('./pages/CustomerListPage'));
const AddCustomerPage = lazy(() => import('./pages/AddCustomerPage'));
const EditCustomerPage = lazy(() => import('./pages/EditCustomerPage'));
const CustomerDetailsPage = lazy(() => import('./pages/CustomerDetailsPage'));
const ProductListPage = lazy(() => import('./pages/ProductListPage'));
const AddProductPage = lazy(() => import('./pages/AddProductPage'));
const EditProductPage = lazy(() => import('./pages/EditProductPage'));
const MakeSalePage = lazy(() => import('./pages/MakeSalePage'));
const ReceiptPage = lazy(() => import('./pages/ReceiptPage'));
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


// --- UPDATED Header Component ---
const Header = ({ handleLogout, isLoggingOut, user, userRole, onProfileClick }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const handleMenu = (event) => setAnchorEl(event.currentTarget);
    const handleClose = () => setAnchorEl(null);

    const adminName = user?.displayName || user?.email || "Admin";
    const roleDisplay = userRole ? userRole.charAt(0).toUpperCase() + userRole.slice(1) : 'User';

    return (
        <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, backgroundColor: '#ffffff', color: '#1a2c3a' }} className="app-header no-print">
            <Toolbar sx={{ justifyContent: 'space-between' }}>
                {/* Left Side: Title with Redirect to Home */}
                <MuiLink component={RouterLink} to="/" underline="none" color="inherit">
                    <Typography 
                        variant="h6" 
                        noWrap 
                        component="div" 
                        sx={{ fontWeight: 'bold', color: 'primary.main', cursor: 'pointer' }}
                    >
                        Fahim Poultry Feed
                    </Typography>
                </MuiLink>

                {/* Right Side: Admin Info & Logout */}
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ textAlign: 'right', mr: 2, display: { xs: 'none', sm: 'block' } }}>
                         <Typography variant="body1" sx={{ lineHeight: 1.2 }}>
                             {adminName}
                         </Typography>
                         <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.2 }}>
                             {roleDisplay}
                         </Typography>
                    </Box>

                    <IconButton
                        size="large"
                        aria-label="account of current user"
                        aria-controls="menu-appbar"
                        aria-haspopup="true"
                        onClick={handleMenu}
                        color="inherit"
                    >
                        <Avatar
                            src={user?.photoURL || undefined}
                            sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}
                        >
                            {!user?.photoURL && (adminName ? adminName.charAt(0).toUpperCase() : <AccountCircle />)}
                        </Avatar>
                    </IconButton>
                    <Menu
                        id="menu-appbar"
                        anchorEl={anchorEl}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        keepMounted
                        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                        open={open}
                        onClose={handleClose}
                        sx={{ mt: 1 }}
                    >
                        <MenuItem onClick={() => { handleClose(); onProfileClick(); }}>Profile</MenuItem>
                        <MenuItem onClick={() => { handleClose(); handleLogout(); }} disabled={isLoggingOut}>
                            {isLoggingOut ? <CircularProgress size={20} sx={{ mr: 1 }}/> : <LogoutIcon fontSize="small" sx={{ mr: 1 }}/>} Logout
                        </MenuItem>
                    </Menu>
                </Box>
            </Toolbar>
        </AppBar>
    );
};
// --- END Header Component ---


// Sidebar Component (Unchanged)
const Sidebar = () => {
    return (
        <aside className="sidebar no-print">
            <nav className="sidebar-nav">
                <ul>
                    <li><NavLink to="/" end><span className="icon"><DashboardIcon /></span><span>Dashboard</span></NavLink></li>
                    <li><NavLink to="/customers"><span className="icon"><PeopleAltIcon /></span><span>Customers</span></NavLink></li>
                    <li><NavLink to="/inventory"><span className="icon"><InventoryIcon /></span><span>Inventory</span></NavLink></li>
                    <li><NavLink to="/make-sale"><span className="icon"><ShoppingCartIcon /></span><span>Make Sale</span></NavLink></li>
                    <li><NavLink to="/wholesale"><span className="icon"><StorefrontIcon /></span><span>Wholesale</span></NavLink></li>
                    <li><NavLink to="/reports/sales"><span className="icon"><AssessmentIcon /></span><span>Sales Report</span></NavLink></li>
                    <li><NavLink to="/history"><span className="icon"><HistoryIcon /></span><span>History</span></NavLink></li>
                </ul>
            </nav>
        </aside>
    );
};

// Footer Component (Unchanged)
const Footer = () => (
    <Box component="footer" sx={{ py: 1.5, px: 2, borderTop: '1px solid #e0e0e0', bgcolor: '#f7f9fc', textAlign: 'center', flexShrink: 0 }} className="no-print">
        <Typography variant="body2" color="text.secondary"> © {new Date().getFullYear()} Fahim Poultry Feed | Developed by Meherab Hasan Fahim </Typography>
    </Box>
);


// Main App Structure (Unchanged)
const AppContent = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { isAuthenticated, logout, isLoading: isAuthLoading, user, userRole } = useAuth();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try { await logout(); navigate('/login'); }
        catch (error) { console.error("Logout failed:", error); /* Add toast? */ }
        finally { setIsLoggingOut(false); }
    };

    const isAuthPage = location.pathname === '/login';
    const isReceiptPage = /^\/receipt\/[a-fA-F0-9]{24}$/.test(location.pathname);
    const showLayout = isAuthenticated && !isAuthPage && !isReceiptPage;

    if (isAuthLoading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="app-layout">
            <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop theme="colored" />
            {showLayout && (
                <Header
                    handleLogout={handleLogout}
                    isLoggingOut={isLoggingOut}
                    user={user}
                    userRole={userRole}
                    onProfileClick={() => setIsProfileModalOpen(true)}
                />
            )}

            <div className="main-content-wrapper">
                {showLayout && <Sidebar />}
                <main className={showLayout ? "main-content" : "main-content-fullscreen"}>
                    {showLayout && <Toolbar />}
                    <Suspense fallback={<LoadingSpinner />}>
                        <Routes>
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/receipt/:transactionId" element={<ReceiptPage />} />
                            <Route path="/receipt" element={<Typography sx={{ p: 3, textAlign: 'center', color: 'error.main' }}>Error: Receipt ID missing in URL.</Typography>} />

                            <Route element={<ProtectedRoute />}>
                                <Route path="/" element={<DashboardPage />} />
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
                            </Route>

                            <Route path="*" element={<ErrorPage />} />
                        </Routes>
                    </Suspense>
                </main>
            </div>
            {showLayout && <Footer />}

            <ProfileEditModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
            />
        </div>
    );
};

function App() {
    return <AppContent />;
}

export default App;