import React, { Suspense, lazy } from 'react';
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

// --- Create a loading component for Suspense ---
const LoadingSpinner = () => (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
    </Box>
);

// --- Lazily import all page components for code splitting ---
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


const Sidebar = ({ handleLogout }) => {
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
                <button onClick={handleLogout} className="logout-button"><span className="icon"><LogoutIcon /></span><span>Logout</span></button>
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
    const { isAuthenticated, logout } = useAuth(); // <-- Use context for auth state

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isAuthPage = location.pathname === '/login';
    const isReceiptPage = location.pathname === '/receipt';

    const showLayout = isAuthenticated && !isAuthPage && !isReceiptPage;

    return (
        <div className="app-layout">
            <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
            
            <style>{`
                :root { 
                    --sidebar-width-expanded: 240px; 
                    --sidebar-width-collapsed: 70px; 
                } 
                body { margin: 0; background-color: #f7f9fc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; } 
                .app-layout { display: flex; min-height: 100vh; flex-direction: column; } 
                .main-content-wrapper { display: flex; flex-grow: 1; }
                
                .sidebar { 
                    width: var(--sidebar-width-collapsed); 
                    background-color: #1a2c3a; 
                    color: #e5e7eb; 
                    display: flex; 
                    flex-direction: column; 
                    position: fixed; 
                    height: 100%; 
                    top: 0; 
                    left: 0; 
                    transition: width 0.3s ease; 
                    flex-shrink: 0; 
                    z-index: 1000;
                    overflow-x: hidden;
                } 
                
                .sidebar:hover {
                    width: var(--sidebar-width-expanded);
                }

                .main-content { 
                    flex-grow: 1; 
                    padding: 2rem; 
                    margin-left: var(--sidebar-width-collapsed); 
                    transition: margin-left 0.3s ease; 
                } 
                
                .sidebar:hover ~ .main-content {
                    margin-left: var(--sidebar-width-expanded);
                }

                .main-content-fullscreen { flex-grow: 1; } 
                
                .sidebar-header { padding: 1.5rem; text-align: center; border-bottom: 1px solid #2d3748; flex-shrink: 0; } 
                
                .sidebar-header h3, 
                .sidebar-nav a span:not(.icon), 
                .logout-button span:not(.icon) { 
                    opacity: 0;
                    white-space: nowrap; 
                    overflow: hidden; 
                    transition: opacity 0.3s ease; 
                } 

                .sidebar:hover .sidebar-header h3,
                .sidebar:hover .sidebar-nav a span:not(.icon),
                .sidebar:hover .logout-button span:not(.icon) {
                    opacity: 1; 
                }

                .sidebar-header h3 { margin: 0; font-size: 1.25rem; color: #ffffff; } 
                
                .sidebar-nav { flex-grow: 1; padding-top: 0.5rem; } 
                .sidebar-nav ul { list-style: none; padding: 0; margin: 0; } 
                .sidebar-nav a { 
                    display: flex; 
                    align-items: center; 
                    padding: 1.5rem 1rem;
                    color: #a0aec0; 
                    text-decoration: none; 
                    font-weight: 500; 
                    font-size: 1rem; 
                    transition: background-color 0.2s, color 0.2s; 
                    border-left: 4px solid transparent; 
                } 
                .sidebar-nav a:hover { background-color: #2d3748; color: #ffffff; } 
                .sidebar-nav a.active { background-color: #2d3748; color: #ffffff; border-left-color: #27ae60; } 
                .sidebar-nav .icon { 
                    margin-right: 1rem; 
                    min-width: 22px; 
                    height: 22px; 
                    flex-shrink: 0; 
                } 
                .sidebar:hover .sidebar-nav .icon {
                     margin-right: 1.1rem;
                }

                .sidebar-footer { padding: 1.5rem 1rem; border-top: 1px solid #2d3748; flex-shrink: 0; } 
                .logout-button { 
                    width: 100%; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    padding: 0.75rem 0;
                    background-color: transparent; 
                    color: #a0aec0; 
                    border: 1px solid #4a5568; 
                    border-radius: 8px; 
                    font-size: 1rem; 
                    font-weight: 500; 
                    cursor: pointer; 
                    transition: background-color 0.2s, color 0.2s; 
                } 
                .logout-button:hover { background-color: #e53e3e; border-color: #e53e3e; color: #ffffff; } 
                .logout-button .icon { margin-right: 0; } 
                
                @media (max-width: 768px) { 
                    .sidebar, .sidebar:hover { width: var(--sidebar-width-collapsed) !important; } 
                    .main-content, .sidebar:hover ~ .main-content { margin-left: var(--sidebar-width-collapsed) !important; padding: 1rem; } 
                    .sidebar-header h3, .sidebar-nav a span:not(.icon), .logout-button span:not(.icon) { display: none; } 
                    .sidebar-nav a { justify-content: center; padding: 1rem 0; } 
                    .logout-button { justify-content: center; } 
                    .logout-button .icon { margin: 0; }
                }
            `}</style>
            <div className="main-content-wrapper">
                {showLayout && <Sidebar handleLogout={handleLogout} />}
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
                                <Route path="*" element={<ErrorPage />} />
                            </Route>
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