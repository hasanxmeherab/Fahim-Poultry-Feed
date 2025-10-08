import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate, useLocation } from 'react-router-dom';
import api from './api/api';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

// MUI Imports for layout and footer
import { Box, Typography } from '@mui/material';

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

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// --- INLINE ICON COMPONENTS ---
const IconDashboard = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>;
const IconCustomers = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m-7.5-2.952a4.5 4.5 0 119 0M6 10.5a4.5 4.5 0 119 0M6 10.5a4.5 4.5 0 00-4.5 4.5v3.75a2.25 2.25 0 002.25 2.25h13.5a2.25 2.25 0 002.25-2.25V15a4.5 4.5 0 00-4.5-4.5H6Z" /></svg>;
const IconInventory = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5-3.75a9.06 9.06 0 00-4.125-.875 9.06 9.06 0 00-4.125.875m-4.125-.875a9.06 9.06 0 00-4.125.875m16.5 0a9.06 9.06 0 01-4.125.875 9.06 9.06 0 01-4.125-.875" /></svg>;
const IconMakeSale = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c.51 0 .962-.343 1.087-.835l1.838-5.513a1.125 1.125 0 00-1.087-1.665h-16.5" /></svg>;
const IconWholesale = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h6M9 11.25h6M9 15.75h6" /></svg>;
const IconReport = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3Z" /></svg>;
const IconHistory = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0Z" /></svg>;
const IconLogout = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>;

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
                    <li><NavLink to="/"><span className="icon"><IconDashboard /></span><span>Dashboard</span></NavLink></li>
                    <li><NavLink to="/customers"><span className="icon"><IconCustomers /></span><span>Customers</span></NavLink></li>
                    <li><NavLink to="/inventory"><span className="icon"><IconInventory /></span><span>Inventory</span></NavLink></li>
                    <li><NavLink to="/make-sale"><span className="icon"><IconMakeSale /></span><span>Make a Sale</span></NavLink></li>
                    <li><NavLink to="/wholesale"><span className="icon"><IconWholesale /></span><span>Wholesale</span></NavLink></li>
                    <li><NavLink to="/reports/sales"><span className="icon"><IconReport /></span><span>Sales Report</span></NavLink></li>
                    <li><NavLink to="/history"><span className="icon"><IconHistory /></span><span>History</span></NavLink></li>
                </ul>
            </nav>
            <div className="sidebar-footer">
                <button onClick={handleLogout} className="logout-button"><span className="icon"><IconLogout /></span><span>Logout</span></button>
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
                // ADD responsive horizontal padding
                px: { xs: 2, md: '15%' }, 
                borderTop: '1px solid #e0e0e0',
                bgcolor: '#f7f9fc',
                display: 'flex',
                // CHANGE back to space-between
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