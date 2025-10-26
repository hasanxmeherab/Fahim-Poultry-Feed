import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Link as RouterLink } from 'react-router-dom';

// MUI Imports
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
    CircularProgress,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Avatar,
    useTheme,
    Divider,
    Button,
    Link as MuiLink
} from '@mui/material';

// Icons
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import HistoryIcon from '@mui/icons-material/History';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// StatCard with Icon and optional Link, including animation class
const StatCard = ({ title, value, icon, color = 'text.primary', bgColor = 'background.paper', linkTo }) => {
    const cardContent = (
        <Paper
            className="scale-up-center-normal" // Apply animation class
            sx={{
                p: 2.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                height: '100%',
                bgcolor: bgColor,
                boxShadow: 3,
                transition: 'transform 0.2s ease-in-out',
                '&:hover': linkTo ? {
                    transform: 'translateY(-4px)',
                    boxShadow: 6,
                } : {},
            }}>
            <Box>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 0.5 }}>{title}</Typography>
                <Typography variant="h4" component="p" sx={{ fontWeight: 'bold', color }}>{value}</Typography>
            </Box>
            <Avatar sx={{ bgcolor: color, color: 'common.white', width: 56, height: 56 }}>
                 {icon}
            </Avatar>
        </Paper>
    );

    return linkTo ? (
        <MuiLink component={RouterLink} to={linkTo} underline="none">
            {cardContent}
        </MuiLink>
    ) : (
        cardContent
    );
};


const DashboardPage = () => {
    const [stats, setStats] = useState(null);
    const [chartData, setChartData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const theme = useTheme();

    useEffect(() => {
        const fetchAllData = async () => {
             setIsLoading(true);
             setError(null);
            try {
                const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
                const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
                const startDateISO = todayStart.toISOString();
                const endDateISO = todayEnd.toISOString();

                const [statsRes, chartsRes] = await Promise.all([
                    api.get(`/dashboard/stats?startDate=${startDateISO}&endDate=${endDateISO}`),
                    api.get('/reports/dashboard-charts')
                ]);
                setStats(statsRes.data);
                setChartData(chartsRes.data);
            } catch (err) {
                setError('Failed to fetch dashboard data. Please check connection and try again.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAllData();
    }, []);

    const salesChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' }, title: { display: false } },
        scales: {
             x: { grid: { display: false } },
             y: { grid: { color: theme.palette.divider } }
        }
    };

    const salesChartData = {
        labels: chartData?.dailySales.map(d => new Date(d._id).toLocaleDateString('en-BD', { weekday: 'short', month: 'short', day: 'numeric' })) || [],
        datasets: [{
            label: 'Revenue (TK)',
            data: chartData?.dailySales.map(d => d.totalRevenue) || [],
            backgroundColor: theme.palette.primary.main,
            hoverBackgroundColor: theme.palette.primary.dark,
            borderRadius: 6,
            barThickness: 'flex',
            maxBarThickness: 50,
        }],
    };

    if (isLoading) {
        return ( <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><CircularProgress /></Box> );
    }

    if (error) {
        return <Typography color="error" align="center" sx={{ mt: 4, p: 2 }}>{error}</Typography>;
    }

    if (!stats || !chartData) {
         return <Typography align="center" sx={{ mt: 4, p: 2 }}>Could not load dashboard data.</Typography>;
    }

    const debtColor = stats.negativeBalanceCustomers > 0 ? theme.palette.error.main : theme.palette.text.primary;
    const lowStockColor = stats.lowStockProducts > 0 ? theme.palette.warning.main : theme.palette.text.primary;

    return (
        <Box sx={{ p: { xs: 1, sm: 2 }, width: '100%' }}>
            <Typography variant="h4" component="h1" sx={{ mb: 3, fontWeight: 'bold' }}>Dashboard Overview</Typography>

            {/* Stat Cards Grid */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={4}>
                    <StatCard
                        title="Sales Today"
                        value={`TK ${stats.salesToday.toFixed(2)}`}
                        icon={<PointOfSaleIcon />}
                        color={theme.palette.success.dark}
                        linkTo="/reports/sales"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <StatCard
                        title="Customers with Debt"
                        value={stats.negativeBalanceCustomers}
                        icon={<PeopleOutlineIcon />}
                        color={debtColor}
                        linkTo="/customers"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <StatCard
                        title="Products Low in Stock (<10)"
                        value={stats.lowStockProducts}
                        icon={<Inventory2OutlinedIcon />}
                        color={lowStockColor}
                        linkTo="/inventory"
                    />
                </Grid>
            </Grid>

            {/* Charts and Top Products Grid */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {/* Sales Chart */}
                <Grid item xs={12} lg={8}>
                     <Paper sx={{ p: 3, height: '400px', display: 'flex', flexDirection: 'column', boxShadow: 3 }}>
                        <Typography variant="h6" component="h3" sx={{ mb: 2 }}>Sales Trend (Last 7 Days)</Typography>
                        <Box sx={{ flexGrow: 1, position: 'relative' }}>
                           <Bar options={salesChartOptions} data={salesChartData} />
                        </Box>
                    </Paper>
                </Grid>
                {/* Top Selling Products List */}
                <Grid item xs={12} lg={4}>
                     <Paper sx={{ p: 3, height: '400px', display: 'flex', flexDirection: 'column', boxShadow: 3 }}>
                        <Typography variant="h6" component="h3" sx={{ mb: 1 }}>Top Selling Products</Typography>
                        <List sx={{ overflowY: 'auto', flexGrow: 1 }}>
                            {chartData.topProducts.length > 0 ? chartData.topProducts.map((p, index) => (
                                <React.Fragment key={p._id || index}>
                                    <ListItem disablePadding>
                                        <ListItemAvatar sx={{ minWidth: '40px' }}>
                                            <Avatar sx={{ bgcolor: theme.palette.secondary.light, width: 32, height: 32 }}>
                                                <StarBorderIcon fontSize="small" />
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={p._id || 'Unknown Product'}
                                            secondary={`${p.totalQuantitySold} units sold`}
                                        />
                                    </ListItem>
                                    {index < chartData.topProducts.length - 1 && <Divider variant="inset" component="li" />}
                                </React.Fragment>
                            )) : <Typography sx={{ textAlign: 'center', color: 'text.secondary', mt: 4 }}>No product sales data available.</Typography> }
                        </List>
                    </Paper>
                </Grid>
            </Grid>

            {/* Recent Transactions Table */}
             <Typography variant="h5" component="h2" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                 <HistoryIcon sx={{ mr: 1 }} /> Recent Transactions
             </Typography>
            <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
                <Table size="small">
                    <TableHead>
                        <TableRow sx={{ '& th': { backgroundColor: 'action.hover', fontWeight: 'bold' } }}>
                            <TableCell>Date & Time</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Details</TableCell>
                            <TableCell>Customer/Buyer</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {stats.recentTransactions.length > 0 ? stats.recentTransactions.map(t => (
                            <TableRow key={t._id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                <TableCell sx={{ whiteSpace: 'nowrap' }}>{new Date(t.createdAt).toLocaleString()}</TableCell>
                                <TableCell>{t.type?.replace('_',' ')}</TableCell>
                                <TableCell>{t.notes || 'No details'}</TableCell>
                                <TableCell>
                                    {t.customer?.name || t.wholesaleBuyer?.name || t.randomCustomerName || '-'}
                                </TableCell>
                            </TableRow>
                        )) : (
                             <TableRow>
                                 <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                                     <Typography color="text.secondary">No recent transactions found.</Typography>
                                 </TableCell>
                             </TableRow>
                        )}
                    </TableBody>
                </Table>
                 <Box sx={{ p: 1, textAlign: 'right' }}>
                    <Button component={RouterLink} to="/history" size="small">
                        View All History
                    </Button>
                 </Box>
            </TableContainer>
        </Box>
    );
};

export default DashboardPage;