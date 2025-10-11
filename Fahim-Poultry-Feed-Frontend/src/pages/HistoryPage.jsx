import React, { useState, useEffect } from 'react';
import api from '../api/api';

// MUI Imports
import { 
    Box, Button, Typography, Table, TableBody, 
    TableCell, TableContainer, TableHead, TableRow, 
    Paper, CircularProgress, Pagination, TextField 
} from '@mui/material';

const HistoryPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [searchTrigger, setSearchTrigger] = useState(0);

  useEffect(() => {
    const fetchTransactions = async () => {
      setIsLoading(true);
      try {
        let url = `/transactions?page=${page}`;
        if (dateRange.startDate && dateRange.endDate) {
            url += `&startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`;
        }
        const response = await api.get(url);
        setTransactions(response.data.transactions);
        setTotalPages(response.data.totalPages);
        setError(null);
      } catch (err) {
        setError('Failed to fetch transaction history.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchTransactions();
  }, [page, searchTrigger]);

  const handleDateChange = (e) => {
    setDateRange({ ...dateRange, [e.target.name]: e.target.value });
  };

  const handleSearch = () => {
    setPage(1);
    setSearchTrigger(prev => prev + 1);
  };

  const handleReset = () => {
    setDateRange({ startDate: '', endDate: '' });
    setPage(1);
    setSearchTrigger(prev => prev + 1);
  };

  const handleViewReceipt = (transaction) => {
    let receiptData = {};
    if (transaction.type === 'SALE') {
        const isRandomSale = !transaction.customer;
        receiptData = {
            type: 'sale', 
            customerName: transaction.customer?.name || transaction.randomCustomerName || 'Random Customer', 
            items: transaction.items,
            totalAmount: transaction.amount, 
            balanceBefore: isRandomSale ? null : transaction.balanceBefore,
            balanceAfter: isRandomSale ? null : transaction.balanceAfter, 
            date: transaction.createdAt,
            paymentMethod: transaction.paymentMethod
        };
    } else if (transaction.type === 'DEPOSIT' || transaction.type === 'WITHDRAWAL') {
        receiptData = {
            type: 'deposit', 
            customerName: transaction.customer?.name || transaction.wholesaleBuyer?.name, 
            depositAmount: transaction.amount,
            balanceBefore: transaction.balanceBefore, 
            balanceAfter: transaction.balanceAfter,
            date: transaction.createdAt,
        };
    } else if (transaction.type === 'BUY_BACK') {
        receiptData = {
            type: 'buy_back',
            customerName: transaction.customer?.name,
            date: transaction.createdAt,
            buyBackQuantity: transaction.buyBackQuantity,
            buyBackWeight: transaction.buyBackWeight,
            buyBackPricePerKg: transaction.buyBackPricePerKg,
            totalAmount: transaction.amount,
            balanceBefore: transaction.balanceBefore,
            referenceName: transaction.referenceName,
            balanceAfter: transaction.balanceAfter,
        };
    } else if (transaction.type === 'WHOLESALE_SALE') {
        receiptData = {
            type: 'wholesale_sale',
            customerName: transaction.wholesaleBuyer?.name,
            items: transaction.customItems,
            totalAmount: transaction.amount,
            balanceBefore: transaction.balanceBefore,
            balanceAfter: transaction.balanceAfter,
            date: transaction.createdAt,
        };
    } else { 
        return; 
    }
    sessionStorage.setItem('receiptData', JSON.stringify(receiptData));
    window.open('/receipt', '_blank');
  };

  const renderDetail = (t) => {
    if (t.type === 'SALE' && !t.customer) {
        return `Cash sale to ${t.randomCustomerName || 'a random customer'}`;
    }
    if (t.type === 'SALE' && t.customer) {
        if (t.paymentMethod === 'Cash') {
            return `${t.notes} (Paid in Cash)`;
        }
    }
    return t.notes;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>Transaction History</Typography>
      
      <Paper sx={{ p: 2, mb: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField name="startDate" label="Start Date" type="date" value={dateRange.startDate} onChange={handleDateChange} InputLabelProps={{ shrink: true }} size="small" />
        <TextField name="endDate" label="End Date" type="date" value={dateRange.endDate} onChange={handleDateChange} InputLabelProps={{ shrink: true }} size="small" />
        <Button variant="contained" onClick={handleSearch}>Search</Button>
        <Button variant="outlined" onClick={handleReset}>Reset</Button>
      </Paper>
      
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}><CircularProgress /></Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ '& th': { backgroundColor: '#f4f6f8', fontWeight: 'bold' } }}>
                <TableCell>Date</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Details</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.map((t) => (
                <TableRow key={t._id} hover>
                  <TableCell>{new Date(t.createdAt).toLocaleString()}</TableCell>
                  <TableCell>{t.type}</TableCell>
                  <TableCell>{renderDetail(t)}</TableCell>
                  <TableCell>
                    {['SALE', 'DEPOSIT', 'WITHDRAWAL', 'BUY_BACK', 'WHOLESALE_SALE'].includes(t.type) && (
                        <Button onClick={() => handleViewReceipt(t)} size="small" variant="outlined">
                            View Receipt
                        </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {totalPages > 1 && (
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
            <Pagination count={totalPages} page={page} onChange={(e, value) => setPage(value)} color="primary" />
        </Box>
      )}
    </Box>
  );
};

export default HistoryPage;