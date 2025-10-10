import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate, useLocation } from 'react-router-dom';
import api from './api/api';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

//Toast notification
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// MUI Imports
import { Box, Typography } from '@mui/material';
import { Card, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';

// --- NEW MUI ICON IMPORTS ---
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import InventoryIcon from '@mui/icons-material/Inventory';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import StorefrontIcon from '@mui/icons-material/Storefront';
import AssessmentIcon from '@mui/icons-material/Assessment';
import HistoryIcon from '@mui/icons-material/History';
import LogoutIcon from '@mui/icons-material/Logout';

// Core Components
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';

// Page Components
import CustomerDetailsPage from './pages/CustomerDetailsPage';
import SalesReportPage from './pages/SalesReportPage';
import EditProductPage from './pages/EditProductPage';
import EditCustomerPage from './pages/EditCustomerPage';
import CustomerListPage from './pages/CustomerListPage';
import AddCustomerPage from './pages/AddCustomerPage';
import ProductListPage from './pages/ProductListPage';
import AddProductPage from './pages/AddProductPage';
import MakeSalePage from './pages/MakeSalePage';
import ReceiptPage from './pages/ReceiptPage';
import HistoryPage from './pages/HistoryPage';
import BatchReportPage from './pages/BatchReportPage';
import WholesalePage from './pages/WholesalePage';
import AddWholesaleBuyerPage from './pages/AddWholesaleBuyerPage';
import EditWholesaleBuyerPage from './pages/EditWholesaleBuyerPage';
import WholesaleBuyerDetailsPage from './pages/WholesaleBuyerDetailsPage';
import AddWholesaleProductPage from './pages/AddWholesaleProductPage';
import EditWholesaleProductPage from './pages/EditWholesaleProductPage';
import ErrorPage from './pages/ErrorPage';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// --- REMOVED: The old block of inline SVG icon components ---

// Using the original, simpler HomePage component from your old version
const HomePage = () => {
    const [stats, setStats] = useState(null);
    const [chartData, setChartData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                const [statsRes, chartsRes] = await Promise.all([
                    api.get('/dashboard/stats'),
                    api.get('/reports/dashboard-charts')
                ]);
                setStats(statsRes.data);
                setChartData(chartsRes.data);
            } catch (err) {
                setError('Failed to fetch dashboard data.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAllData();
    }, []);

    const salesChartOptions = {
        responsive: true,
        plugins: { legend: { position: 'top' }, title: { display: true, text: 'Daily Sales (Last 7 Days)' } },
    };

    const salesChartData = {
        labels: chartData?.dailySales.map(d => new Date(d._id).toLocaleDateString('en-US', { weekday: 'short' })) || [],
        datasets: [{
            label: 'Revenue (TK)',
            data: chartData?.dailySales.map(d => d.totalRevenue) || [],
            backgroundColor: 'rgba(39, 174, 96, 0.7)',
        }],
    };

    if (isLoading) return <p>Loading dashboard...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;
    if (!stats) return null;

    return (
        <div>
            <h1>Dashboard</h1>
            <div className="stat-cards">
                <div className="stat-card"><h3>Sales Today</h3><p>TK {stats.salesToday.toFixed(2)}</p></div>
                <div className="stat-card"><h3>Customers with Debt</h3><p>{stats.negativeBalanceCustomers}</p></div>
                <div className="stat-card"><h3>Products Low in Stock</h3><p>{stats.lowStockProducts}</p></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginTop: '40px' }}>
                <div style={{ background: 'white', padding: '20px', borderRadius: '5px' }}>
                    <h3>Sales Trend</h3>
                    <Bar options={salesChartOptions} data={salesChartData} />
                </div>
                <div style={{ background: 'white', padding: '20px', borderRadius: '5px' }}>
                    <h3>Top Selling Products</h3>
                    <ol style={{ paddingLeft: '20px' }}>
                        {chartData?.topProducts.map(p => (
                            <li key={p._id} style={{ marginBottom: '10px', fontSize: '1.1em' }}>
                                {p._id} - <span style={{ fontWeight: 'bold' }}>{p.totalQuantitySold} units</span>
                            </li>
                        ))}
                    </ol>
                </div>
            </div>
            <h2>Recent Transactions</h2>
            <table>
                <thead><tr><th>Date</th><th>Type</th><th>Details</th></tr></thead>
                <tbody>{stats.recentTransactions.map(t => (<tr key={t._id}><td>{new Date(t.createdAt).toLocaleString()}</td><td>{t.type}</td><td>{t.notes}</td></tr>))}</tbody>
            </table>
        </div>
    );
};


const Sidebar = ({ handleLogout }) => {
    return (
        <aside className="sidebar">
            <div className="sidebar-header"><h3>Fahim Poultry Feed</h3></div>
            <nav className="sidebar-nav">
                <ul>
                    {/* --- UPDATED: Sidebar now uses the imported MUI icons --- */}
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
    const token = localStorage.getItem('userToken');

    const handleLogout = () => {
        localStorage.removeItem('userToken');
        navigate('/login');
    };

    const isAuthPage = location.pathname === '/login';
    const isReceiptPage = location.pathname === '/receipt';

    const showLayout = token && !isAuthPage && !isReceiptPage;

    return (
        <div className="app-layout">
            <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
            <style>{`
                :root { --sidebar-width: 240px; --sidebar-width-collapsed: 70px; } 
                body { margin: 0; background-color: #f7f9fc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; } 
                .app-layout { display: flex; min-height: 100vh; flex-direction: column; } 
                .main-content-wrapper { display: flex; flex-grow: 1; }
                .main-content { flex-grow: 1; padding: 2rem; margin-left: var(--sidebar-width); transition: margin-left 0.3s ease; } 
                .main-content-fullscreen { flex-grow: 1; } 
                .sidebar { width: var(--sidebar-width); background-color: #1a2c3a; color: #e5e7eb; display: flex; flex-direction: column; position: fixed; height: 100%; top: 0; left: 0; transition: width 0.3s ease; flex-shrink: 0; } 
                .sidebar-header { padding: 1.5rem; text-align: center; border-bottom: 1px solid #2d3748; flex-shrink: 0; } 
                .sidebar-header h3 { margin: 0; font-size: 1.25rem; color: #ffffff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } 
                .sidebar-nav { flex-grow: 1; padding-top: 0.5rem; } 
                .sidebar-nav ul { list-style: none; padding: 0; margin: 0; } 
                .sidebar-nav a { display: flex; align-items: center; padding: 1.5rem 1.5rem; color: #a0aec0; text-decoration: none; font-weight: 500; font-size: 1.2rem; transition: background-color 0.2s, color 0.2s; border-left: 4px solid transparent; white-space: nowrap; overflow: hidden; } 
                .sidebar-nav a:hover { background-color: #2d3748; color: #ffffff; } 
                .sidebar-nav a.active { background-color: #2d3748; color: #ffffff; border-left-color: #27ae60; } 
                .sidebar-nav .icon { margin-right: 1.1rem; width: 22px; height: 22px; flex-shrink: 0; } 
                .sidebar-footer { padding: 1.5rem; border-top: 1px solid #2d3748; flex-shrink: 0; } 
                .logout-button { width: 100%; display: flex; align-items: center; justify-content: center; padding: 0.75rem; background-color: transparent; color: #a0aec0; border: 1px solid #4a5568; border-radius: 8px; font-size: 1rem; font-weight: 500; cursor: pointer; white-space: nowrap; overflow: hidden; transition: background-color 0.2s, color 0.2s; } 
                .logout-button:hover { background-color: #e53e3e; border-color: #e53e3e; color: #ffffff; } 
                .logout-button .icon { margin-right: 0.5rem; } 
                @media (max-width: 768px) { 
                    .sidebar { width: var(--sidebar-width-collapsed); } 
                    .sidebar-header h3, .sidebar-nav a span:not(.icon), .logout-button span:not(.icon) { display: none; } 
                    .sidebar-nav a { justify-content: center; padding: 1rem 0; } 
                    .sidebar-nav .icon { margin-right: 0; } 
                    .main-content { margin-left: var(--sidebar-width-collapsed); padding: 1rem; } 
                    .logout-button .icon { margin: 0; } 
                }
            `}</style>
            <div className="main-content-wrapper">
                {showLayout && <Sidebar handleLogout={handleLogout} />}
                <div className={showLayout ? "main-content" : "main-content-fullscreen"}>
                    <Routes>
                        <Route path="/login" element={<LoginPage />} />
                        <Route element={<ProtectedRoute />}>
                            <Route path="/" element={<HomePage />} />
                            <Route path="/customers" element={<CustomerListPage />} />
                            <Route path="/add-customer" element={<AddCustomerPage />} />
                            <Route path="/inventory" element={<ProductListPage />} />
                            <Route path="/add-product" element={<AddProductPage />} />
                            <Route path="/make-sale" element={<MakeSalePage />} />
                            <Route path="/receipt" element={<ReceiptPage />} />
                            <Route path="/history" element={<HistoryPage />} />
                            <Route path="/edit-customer/:id" element={<EditCustomerPage />} />
                            <Route path="/edit-product/:id" element={<EditProductPage />} />
                            <Route path="/reports/sales" element={<SalesReportPage />} />
                            <Route path="/customers/:id" element={<CustomerDetailsPage />} />
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