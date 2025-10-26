import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { Bar, Pie } from 'react-chartjs-2'; // Bar is needed again
import {
    Chart as ChartJS,
    CategoryScale, // Needed for Bar chart
    LinearScale,   // Needed for Bar chart
    BarElement,    // Needed for Bar chart
    Title,
    Tooltip,
    Legend,
    ArcElement // ArcElement needed for both Pie and Donut
} from 'chart.js';
import { Link as RouterLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';


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
import HistoryIcon from '@mui/icons-material/History';
import GroupIcon from '@mui/icons-material/Group';
import StorefrontIcon from '@mui/icons-material/Storefront';
import CategoryIcon from '@mui/icons-material/Category';

// Register Chart.js components - ADDING BACK Bar chart components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

// StatCard Component (Remains unchanged)
const StatCard = ({ title, value, icon, color = 'text.primary', bgColor = 'background.paper', linkTo }) => {
    const cardContent = (
        <Paper
            className="scale-up-center-normal"
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


// --- API Fetch Functions (can be moved to separate file) ---
const fetchDashboardStats = async () => {
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
    const startDateISO = todayStart.toISOString();
    const endDateISO = todayEnd.toISOString();
    const { data } = await api.get(`/dashboard/stats?startDate=${startDateISO}&endDate=${endDateISO}`);
     data.totalCustomers = data.totalCustomers ?? 'N/A';
     data.totalWholesaleBuyers = data.totalWholesaleBuyers ?? 'N/A';
     data.totalProducts = data.totalProducts ?? 'N/A';
    return data;
};

const fetchDashboardCharts = async () => {
    const { data } = await api.get('/reports/dashboard-charts');
    return data;
};
// --- END API Fetch Functions ---


const DashboardPage = () => {
    const theme = useTheme();

    // --- USE useQuery for data fetching ---
    const { data: stats, isLoading: isLoadingStats, error: statsError, isError: isStatsError } = useQuery({
        queryKey: ['dashboardStats'],
        queryFn: fetchDashboardStats,
        staleTime: 1000 * 60 * 2,
        refetchOnWindowFocus: true,
    });

    const { data: chartData, isLoading: isLoadingCharts, error: chartsError, isError: isChartsError } = useQuery({
        queryKey: ['dashboardCharts'],
        queryFn: fetchDashboardCharts,
        staleTime: 1000 * 60 * 2,
        refetchOnWindowFocus: true,
    });
    // --- END useQuery ---

    const isLoading = isLoadingStats || isLoadingCharts;
    const isError = isStatsError || isChartsError;
    const error = statsError || chartsError;


    // --- Chart Configurations ---

    // --- RE-ADDING Bar Chart for "This Week's Sales" ---
    const salesThisWeekOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top', // Position legend at top as in image
                labels: {
                    usePointStyle: false, // Use square legend markers
                    boxWidth: 12,
                    boxHeight: 12,
                }
            },
            title: {
                display: false, // Title moved to Typography above chart
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        let label = context.dataset.label || '';
                        if (label) { label += ': '; }
                        label += new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT' }).format(context.parsed.y);
                        return label;
                    }
                }
            }
        },
        scales: {
            x: {
                grid: { display: false },
                title: {
                    display: false,
                    text: 'Day'
                },
                ticks: {
                    font: { size: 12 }
                }
            },
            y: {
                beginAtZero: true,
                grid: { color: theme.palette.divider },
                title: {
                    display: true,
                    text: '$ (thousands)',
                    font: { size: 12, weight: 'bold' }
                },
                ticks: {
                    callback: function(value) {
                        return value / 1000; // Display in thousands
                    }
                }
            }
        },
        barPercentage: 0.6, // Adjust bar width
        categoryPercentage: 0.7, // Adjust spacing between categories
    };

    const salesThisWeekData = {
        labels: chartData?.dailySalesLabels || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], // Fallback labels
        datasets: [{
            label: 'Sales',
            data: chartData?.dailySalesData || [0, 0, 0, 0, 0, 0, 0], // Fallback data
            backgroundColor: theme.palette.primary.main, // Primary theme color
            borderRadius: 4,
            maxBarThickness: 30, // Max width of a single bar
        }],
    };
    // --- END RE-ADDED Bar Chart ---


    // Pie Chart (Yearly Top Products)
    const generateProductColors = (count) => {
        const customColors = ['#FF9F8A', '#9B59B6', '#A27DE1', '#C58BF2', '#F2A8F7'];
        return Array.from({ length: count }, (_, i) => customColors[i % customColors.length]);
    };

    const yearlyTopProductsData = chartData?.yearlyTopProducts || [];
    const productLabels = yearlyTopProductsData.map(p => p._id);
    const productQuantities = yearlyTopProductsData.map(p => p.totalQuantitySold);
    const productBackgroundColors = generateProductColors(yearlyTopProductsData.length);

    const yearlyPieChartData = {
        labels: productLabels.length > 0 ? productLabels : ['No Sales Data'],
        datasets: [{
            data: productQuantities.length > 0 ? productQuantities : [1],
            backgroundColor: productQuantities.length > 0 ? productBackgroundColors : ['#cccccc'],
            borderColor: theme.palette.background.paper,
            borderWidth: 2,
            spacing: 0,
            hoverOffset: 4,
            offset: productLabels.length > 0 ? productLabels.map((_, index) => (index === 0 || index === 2 || index === 4 ? 15 : 0)) : 0,
        }],
    };

    const yearlyPieChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                align: 'center',
                labels: { usePointStyle: true, padding: 20, font: { size: 14 }, boxWidth: 20, boxHeight: 12 },
            },
            title: { display: false },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        let label = context.label || '';
                        if (label) { label += ': '; }
                        if (context.parsed !== null) { label += context.parsed + ' units'; }
                        return label;
                    }
                }
            }
        },
        cutout: '0%',
    };

    // Donut Chart (Top Customers Monthly)
    const generateCustomerColors = (count) => {
        const customerColors = ['#8E44AD', '#AE84E8', '#5D5FEF', '#F39C12', '#E74C3C', '#3498DB'];
        return Array.from({ length: count }, (_, i) => customerColors[i % customerColors.length]);
    };

    const topCustomersData = chartData?.topCustomersMonthly || [];
    const customerLabels = topCustomersData.map(c => c._id);
    const customerRevenues = topCustomersData.map(c => c.totalRevenue);
    const customerBackgroundColors = generateCustomerColors(topCustomersData.length);
    const totalMonthlyRevenue = customerRevenues.reduce((sum, rev) => sum + rev, 0);

    const customerDoughnutData = {
        labels: customerLabels.length > 0 ? customerLabels : ['No Data'],
        datasets: [{
            data: customerRevenues.length > 0 ? customerRevenues : [1],
            backgroundColor: customerRevenues.length > 0 ? customerBackgroundColors : ['#cccccc'],
            borderColor: theme.palette.background.paper,
            borderWidth: 2,
            spacing: 0,
            hoverOffset: 8,
            offset: 0,
        }],
    };

    const customerDoughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
            legend: {
                position: 'bottom',
                align: 'center',
                labels: {
                    usePointStyle: false,
                    pointStyle: 'rect',
                    padding: 20,
                    font: { size: 12 },
                    boxWidth: 12,
                    boxHeight: 12,
                },
            },
            title: { display: false },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        let label = context.label || '';
                        if (label) { label += ': '; }
                        const value = context.parsed || 0;
                        const percentage = totalMonthlyRevenue > 0 ? ((value / totalMonthlyRevenue) * 100).toFixed(1) + '%' : '0.0%';
                        label += percentage;
                        return label;
                    }
                }
            },
            // Optional Datalabels Plugin config - remove if not installed
            // datalabels: { ... }
        },
    };

    // --- Loading & Error Handling ---
    if (isLoading) {
        return (<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><CircularProgress /></Box>);
    }

    if (isError) {
        const errorMessage = error?.response?.data?.error || error?.message || 'Failed to fetch dashboard data.';
        return <Typography color="error" align="center" sx={{ mt: 4, p: 2 }}>{errorMessage}</Typography>;
    }

    if (!stats || !chartData) {
        return <Typography align="center" sx={{ mt: 4, p: 2 }}>Could not load dashboard data.</Typography>;
    }

    const debtColor = stats.negativeBalanceCustomers > 0 ? theme.palette.error.main : theme.palette.text.primary;
    const lowStockColor = stats.lowStockProducts > 0 ? theme.palette.warning.main : theme.palette.text.primary;

    // --- Render ---
    return (
        <Box sx={{ p: { xs: 1, sm: 2 }, width: '100%' }}>
            <Typography variant="h4" component="h1" sx={{ mb: 3, fontWeight: 'bold' }}>Dashboard Overview</Typography>

            {/* Stat Cards Grid */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={4} lg={2}>
                    <StatCard title="Sales Today" value={`TK ${stats.salesToday?.toFixed(2) ?? '0.00'}`} icon={<PointOfSaleIcon />} color={theme.palette.success.dark} linkTo="/reports/sales"/>
                </Grid>
                <Grid item xs={12} sm={6} md={4} lg={2}>
                    <StatCard title="Total Customers" value={stats.totalCustomers} icon={<GroupIcon />} color={theme.palette.info.main} linkTo="/customers"/>
                </Grid>
                <Grid item xs={12} sm={6} md={4} lg={2}>
                    <StatCard title="Customers with Debt" value={stats.negativeBalanceCustomers} icon={<PeopleOutlineIcon />} color={debtColor} linkTo="/customers"/>
                </Grid>
                <Grid item xs={12} sm={6} md={4} lg={2}>
                    <StatCard title="Total Products" value={stats.totalProducts} icon={<CategoryIcon />} color={theme.palette.warning.dark} linkTo="/inventory"/>
                </Grid>
                <Grid item xs={12} sm={6} md={4} lg={2}>
                    <StatCard title="Products Low Stock" value={stats.lowStockProducts} icon={<Inventory2OutlinedIcon />} color={lowStockColor} linkTo="/inventory"/>
                </Grid>
                <Grid item xs={12} sm={6} md={4} lg={2}>
                    <StatCard title="Wholesale Buyers" value={stats.totalWholesaleBuyers} icon={<StorefrontIcon />} color={theme.palette.secondary.main} linkTo="/wholesale"/>
                </Grid>
            </Grid>

            {/* --- RE-ADDED Sales Chart & ADJUSTED Layout --- */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {/* Top Selling Products (Yearly) Pie Chart - lg={4} */}
                <Grid item xs={12} lg={4}>
                    <Paper sx={{ p: 3, height: '400px', display: 'flex', flexDirection: 'column', boxShadow: 3 }}>
                        <Typography variant="h6" component="h3" sx={{ mb: 2 }}>Top Selling Products ({new Date().getFullYear()})</Typography>
                        {yearlyTopProductsData.length > 0 ? (
                            <Box sx={{ flexGrow: 1, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                <Pie options={yearlyPieChartOptions} data={yearlyPieChartData} />
                            </Box>
                        ) : (
                            <Typography sx={{ textAlign: 'center', color: 'text.secondary', mt: 4 }}>
                                No sales data for current year.
                            </Typography>
                        )}
                    </Paper>
                </Grid>

                 {/* Top Customers Donut Chart - lg={4} */}
                 <Grid item xs={12} lg={4}>
                    <Paper sx={{ p: 3, height: '400px', display: 'flex', flexDirection: 'column', boxShadow: 3 }}>
                        <Typography variant="h6" component="h3" sx={{ mb: 2 }}>Top 05 Customer ({new Date().toLocaleString('default', { month: 'long' })})</Typography>
                        {topCustomersData.length > 0 ? (
                            <Box sx={{ flexGrow: 1, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                <Pie options={customerDoughnutOptions} data={customerDoughnutData} />
                            </Box>
                        ) : (
                            <Typography sx={{ textAlign: 'center', color: 'text.secondary', mt: 4 }}>
                                No sales data for this month.
                            </Typography>
                        )}
                    </Paper>
                </Grid>

                {/* This Week's Sales Bar Chart - NEW/RE-ADDED - lg={4} */}
                <Grid item xs={12} lg={4}>
                    <Paper sx={{ p: 3, height: '400px', display: 'flex', flexDirection: 'column', boxShadow: 3 }}>
                        <Typography variant="h6" component="h3" sx={{ mb: 2 }}>This Week's Sales</Typography> {/* Title as in image */}
                        { (chartData?.dailySalesData?.length > 0 && chartData?.dailySalesData.some(val => val > 0)) ? ( // Check if there's actual data
                            <Box sx={{ flexGrow: 1, position: 'relative' }}>
                                <Bar options={salesThisWeekOptions} data={salesThisWeekData} />
                            </Box>
                        ) : (
                            <Typography sx={{ textAlign: 'center', color: 'text.secondary', mt: 4 }}>
                                No sales data for this week.
                            </Typography>
                        )}
                    </Paper>
                </Grid>
            </Grid>
            {/* --- END RE-ADDED Sales Chart & ADJUSTED Layout --- */}


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
                        {stats.recentTransactions?.length > 0 ? stats.recentTransactions.map(t => (
                            <TableRow key={t._id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                <TableCell sx={{ whiteSpace: 'nowrap' }}>{new Date(t.createdAt).toLocaleString()}</TableCell>
                                <TableCell>{t.type?.replace('_', ' ')}</TableCell>
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