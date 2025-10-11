import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

// MUI Imports - Now all are used
import { 
    Box, 
    Typography, 
    Grid, 
    Paper, 
    Table, 
    TableBody, 
    TableCell, 
    TableContainer, 
    TableHead, 
    TableRow,
    CircularProgress 
} from '@mui/material';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const StatCard = ({ title, value, color = 'text.primary' }) => (
    <Paper sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">{title}</Typography>
        <Typography variant="h4" component="p" sx={{ fontWeight: 'bold', color }}>{value}</Typography>
    </Paper>
);

const DashboardPage = () => {
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
        plugins: { 
            legend: { position: 'top' }, 
            title: { display: true, text: 'Daily Sales (Last 7 Days)' } 
        },
    };

    const salesChartData = {
        labels: chartData?.dailySales.map(d => new Date(d._id).toLocaleDateString('en-US', { weekday: 'short' })) || [],
        datasets: [{
            label: 'Revenue (TK)',
            data: chartData?.dailySales.map(d => d.totalRevenue) || [],
            backgroundColor: 'rgba(39, 174, 96, 0.7)',
            borderRadius: 4,
        }],
    };
    
    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return <Typography color="error" align="center" sx={{ mt: 4 }}>{error}</Typography>;
    }
    
    if (!stats) return null;

    return (
        <Box>
            <Typography variant="h4" component="h1" gutterBottom>Dashboard</Typography>
            
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={4}>
                    <StatCard title="Sales Today" value={`TK ${stats.salesToday.toFixed(2)}`} color="success.main" />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <StatCard title="Customers with Debt" value={stats.negativeBalanceCustomers} color={stats.negativeBalanceCustomers > 0 ? 'error.main' : 'text.primary'} />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <StatCard title="Products Low in Stock" value={stats.lowStockProducts} color={stats.lowStockProducts > 0 ? 'warning.main' : 'text.primary'} />
                </Grid>
            </Grid>

            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} lg={8}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" component="h3">Sales Trend</Typography>
                        <Bar options={salesChartOptions} data={salesChartData} />
                    </Paper>
                </Grid>
                <Grid item xs={12} lg={4}>
                    <Paper sx={{ p: 2, height: '100%' }}>
                        <Typography variant="h6" component="h3">Top Selling Products</Typography>
                        <Box component="ol" sx={{ pl: 3, mt: 1 }}>
                            {chartData?.topProducts.map(p => (
                                <Typography component="li" key={p._id} sx={{ mb: 1 }}>
                                    {p._id} - <Box component="span" sx={{ fontWeight: 'bold' }}>{p.totalQuantitySold} units</Box>
                                </Typography>
                            ))}
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            <Typography variant="h5" component="h2" gutterBottom>Recent Transactions</Typography>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ '& th': { backgroundColor: '#f4f6f8', fontWeight: 'bold' } }}>
                            <TableCell>Date</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Details</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {stats.recentTransactions.map(t => (
                            <TableRow key={t._id} hover>
                                <TableCell>{new Date(t.createdAt).toLocaleString()}</TableCell>
                                <TableCell>{t.type}</TableCell>
                                <TableCell>{t.notes}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default DashboardPage;