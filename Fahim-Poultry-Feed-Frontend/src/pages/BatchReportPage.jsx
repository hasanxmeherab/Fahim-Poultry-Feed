// frontend/src/pages/BatchReportPage.jsx

import React, { useState, useEffect } from 'react';
import api from '../api/api.js';
import { useParams } from 'react-router-dom';

// MUI Imports
import {
    Box, Button, Typography, Paper, Grid, Table,
    TableBody, TableCell, TableContainer, TableHead,
    TableRow, CircularProgress
} from '@mui/material';

const StatCard = ({ title, value }) => (
    <Paper sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="subtitle1" color="text.secondary">{title}</Typography>
        <Typography variant="h5" component="p" sx={{ fontWeight: 'bold' }}>{value}</Typography>
    </Paper>
);

const BatchReportPage = () => {
    const { id } = useParams();
    const [report, setReport] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchReport = async () => {
            try {
                const response = await api.get(`/reports/batch/${id}`);
                setReport(response.data);
            } catch (err) {
                console.error("Failed to fetch batch report.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchReport();
    }, [id]);

    // --- UPDATED handlePrint function ---
    const handlePrint = (sectionId, title) => {
        const printContent = document.getElementById(sectionId);
        if (!printContent) return;

        const printWindow = window.open('', '_blank', 'height=600,width=800');
        
        printWindow.document.write('<html><head><title>' + title + '</title>');
        printWindow.document.write('<link rel="stylesheet" href="/src/index.css" type="text/css" />');
        printWindow.document.write('<style>body { padding: 20px; } table { margin-top: 0; } .no-print { display: none; } h3 { text-align: right; font-size: 1.2em; border-top: 2px solid black; padding-top: 10px; } </style>');
        printWindow.document.write('</head><body>');
        
        const contentClone = printContent.cloneNode(true);
        const button = contentClone.querySelector('button');
        if (button) button.remove();

        let printHTML = contentClone.innerHTML;

        // Add totals based on the section being printed
        if (sectionId === 'sales-section' && report) {
            printHTML += `<h3>Total Sales Amount: TK ${report.totalSold.toFixed(2)}</h3>`;
        }
        if (sectionId === 'buyback-section' && report) {
            printHTML += `<h3>Total Buy Back Amount: TK ${report.totalBought.toFixed(2)}</h3>`;
        }

        printWindow.document.write(printHTML);
        printWindow.document.write('</body></html>');
        
        printWindow.document.close();
        printWindow.focus();
        
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    };

    // --- UPDATED handlePrintFullReport function ---
    const handlePrintFullReport = () => {
        const salesSection = document.getElementById('sales-section');
        const buyBackSection = document.getElementById('buyback-section');

        if (!salesSection || !buyBackSection || !report) return;

        const salesClone = salesSection.cloneNode(true);
        const buyBackClone = buyBackSection.cloneNode(true);

        salesClone.querySelector('button')?.remove();
        buyBackClone.querySelector('button')?.remove();

        const salesContent = salesClone.innerHTML;
        const buyBackContent = buyBackClone.innerHTML;

        const printWindow = window.open('', '_blank', 'height=600,width=800');
        
        printWindow.document.write('<html><head><title>Full Batch Report</title>');
        printWindow.document.write('<link rel="stylesheet" href="/src/index.css" type="text/css" />');
        printWindow.document.write('<style>body { padding: 20px; } .report-section-header > h2 { margin-top: 0; } h3 { text-align: right; font-size: 1.2em; border-top: 2px solid black; padding-top: 10px; margin-top: 15px; } </style>');
        printWindow.document.write('</head><body>');
        printWindow.document.write('<h1>Full Batch Report</h1>');
        printWindow.document.write(salesContent);
        printWindow.document.write(`<h3>Total Sales Amount: TK ${report.totalSold.toFixed(2)}</h3>`); // Add sales total
        printWindow.document.write(buyBackContent);
        printWindow.document.write(`<h3>Total Buy Back Amount: TK ${report.totalBought.toFixed(2)}</h3>`); // Add buy back total
        printWindow.document.write('</body></html>');
        
        printWindow.document.close();
        printWindow.focus();
        
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    };

    if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
    if (!report) return <Typography color="error" sx={{ p: 3 }}>Could not load report data.</Typography>;

    return (
        <Box sx={{ p: 3 }} id="report-container">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }} className="no-print">
                <Typography variant="h4" component="h1">Batch Report</Typography>
                <Button onClick={handlePrintFullReport} variant="contained">Print Full Report</Button>
            </Box>

            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={4}><StatCard title="Total Items Issued" value={`TK ${report.totalSold.toFixed(2)}`} /></Grid>
                <Grid item xs={12} sm={4}><StatCard title="Total Chickens Bought" value={report.totalChickens} /></Grid>
                <Grid item xs={12} sm={4}><StatCard title="Total Buy Back Value" value={`TK ${report.totalBought.toFixed(2)}`} /></Grid>
            </Grid>

            <Paper sx={{ mb: 4 }} id="sales-section">
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
                    <Typography variant="h5">Items Issued (Sales) Details</Typography>
                    <Button onClick={() => handlePrint('sales-section', 'Sales Report')} variant="outlined" className="no-print">Print Sales</Button>
                </Box>
                <TableContainer>
                    <Table>
                        <TableHead><TableRow><TableCell>Date</TableCell><TableCell>Product</TableCell><TableCell>SKU</TableCell><TableCell>Qty</TableCell><TableCell>Price</TableCell><TableCell>Total (TK)</TableCell></TableRow></TableHead>
                        <TableBody>
                            {report.sales.flatMap(sale =>(sale.items || []).map((item, index) => (<TableRow key={`${sale._id}-${index}`}><TableCell>{new Date(sale.createdAt).toLocaleDateString()}</TableCell><TableCell>{item.name || 'N/A'}</TableCell><TableCell>{item.product?.sku || 'N/A'}</TableCell><TableCell>{item.quantity}</TableCell><TableCell>{item.price ? item.price.toFixed(2) : '0.00'}</TableCell><TableCell>{(item.quantity * (item.price || 0)).toFixed(2)}</TableCell></TableRow>)))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            <Paper id="buyback-section">
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
                    <Typography variant="h5">Buy Back Details</Typography>
                    <Button onClick={() => handlePrint('buyback-section', 'Buy Back Report')} variant="outlined" className="no-print">Print Buy Backs</Button>
                </Box>
                <TableContainer>
                    <Table>
                        <TableHead><TableRow><TableCell>Date</TableCell><TableCell>Chickens (Qty)</TableCell><TableCell>Weight (kg)</TableCell><TableCell>Price/kg (TK)</TableCell><TableCell>Total (TK)</TableCell><TableCell>Reference</TableCell></TableRow></TableHead>
                        <TableBody>
                            {report.buyBacks.map(buy => (<TableRow key={buy._id}><TableCell>{new Date(buy.createdAt).toLocaleDateString()}</TableCell><TableCell>{buy.buyBackQuantity}</TableCell><TableCell>{buy.buyBackWeight.toFixed(2)}</TableCell><TableCell>{buy.buyBackPricePerKg.toFixed(2)}</TableCell><TableCell>{buy.amount.toFixed(2)}</TableCell><TableCell>{buy.referenceName}</TableCell></TableRow>))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
};

export default BatchReportPage;