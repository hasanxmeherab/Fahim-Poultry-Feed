import React, { useEffect } from 'react'; // Removed useState
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/api';
import { printThermalReceipt } from '../utils/printUtils';

// MUI Imports
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';

// API Fetch function for a single transaction (could be moved to an api service file)
const fetchTransactionDetails = async (transactionId) => {
    if (!transactionId) throw new Error("Transaction ID is missing in URL.");
    console.log(`ReceiptPage: Fetching transaction details for ID: ${transactionId}`); // Debug log
    const { data } = await api.get(`/transactions/${transactionId}`);
    if (!data) throw new Error(`Transaction with ID ${transactionId} not found.`);
    console.log("ReceiptPage: Fetched transaction data:", data); // Debug log
    return data; // Backend should return the populated transaction
};

const ReceiptPage = () => {
    const { transactionId } = useParams(); // Get ID from URL parameter ':transactionId'

    // Fetch transaction data using useQuery
    const { data: receiptData, isLoading, error, isError, isSuccess } = useQuery({
        queryKey: ['transactionReceipt', transactionId], // Unique key including ID
        queryFn: () => fetchTransactionDetails(transactionId),
        enabled: !!transactionId, // Only run if transactionId is available
        staleTime: Infinity, // Receipt data is static, cache forever
        retry: (failureCount, error) => { // Don't retry endlessly on 404
             return error.response?.status !== 404 && failureCount < 2;
        },
        refetchOnWindowFocus: false, // No need to refetch on focus
    });

    // Attempt auto-print once data is successfully loaded
    useEffect(() => {
        if (isSuccess && receiptData) {
            console.log("ReceiptPage: Data loaded, attempting auto-print."); // Debug log
            const timer = setTimeout(() => {
                handlePrint();
            }, 300); // Short delay for rendering
            return () => clearTimeout(timer); // Cleanup timer
        }
    }, [isSuccess, receiptData]);

    // Print handler
    const handlePrint = () => {
        const receiptContent = document.getElementById('receipt-container');
        if (receiptContent && receiptData) {
            const title = receiptData.type
                ? `${receiptData.type.replace('_', ' ').toUpperCase()} Receipt - ${new Date(receiptData.createdAt || Date.now()).toLocaleDateString()}`
                : 'Receipt';
            console.log("ReceiptPage: Calling printThermalReceipt..."); // Debug log
            printThermalReceipt(receiptContent.innerHTML, title);
        } else {
            console.error("ReceiptPage: Cannot print - Receipt container or data not found.");
            // Optionally show user error via state if needed
        }
    };

    // --- Common Components (Unchanged) ---
    const ReceiptHeader = () => (
        <div className="receipt-header" style={{ textAlign: 'center', marginBottom: '15px' }}>
            <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 2px 0' }}>Fahim Poultry Feed</h1>
            <p style={{ fontSize: '12px', lineHeight: 1.4, margin: 0 }}>Pubali Bazar, Ghorashal</p>
            <p style={{ fontSize: '12px', lineHeight: 1.4, margin: 0 }}>Santanpara, Palash, Narsingdi</p>
            <p style={{ fontSize: '12px', lineHeight: 1.4, margin: 0 }}>Phone: 01743681401</p>
        </div>
    );

    const ReceiptFooter = () => (
         <>
            <div className="signature-area" style={{ marginTop: '30px', paddingTop: '40px', borderTop: '1px dashed #000', textAlign: 'right' }}>
                <p style={{ margin: 0 }}>_________________________</p>
                <p style={{ marginTop: '5px', fontSize: '12px', margin: 0 }}>Authorized Signature</p>
            </div>
            {/* Show print button only if data loaded successfully */}
            {isSuccess && receiptData && (
                <Box sx={{ textAlign: 'center', mt: 3 }} className="no-print">
                    <Button id="print-button" onClick={handlePrint} variant="contained">
                        Print Receipt
                    </Button>
                </Box>
            )}
        </>
     );


    // --- Styling Objects (Unchanged) ---
    const receiptStyles = { width: '300px', margin: '20px auto', padding: '15px', border: '1px solid #ccc', fontFamily: '"Courier New", Courier, monospace', fontSize: '12px', boxShadow: '0 0 10px rgba(0,0,0,0.1)', color: '#000' };
    const tableStyles = { width: '100%', fontSize: '12px', borderCollapse: 'collapse', margin: '8px 0' };
    const thStyles = { textAlign: 'left', borderBottom: '1px dashed #000', padding: '4px 2px', fontWeight: 'bold' };
    const tdStyles = { padding: '4px 2px', verticalAlign: 'top' };
    const alignRight = { textAlign: 'right' };
    const alignCenter = { textAlign: 'center' };
    const totalLineStyle = { textAlign: 'right', fontSize: '1.1em', fontWeight: 'bold', marginTop: '8px' };
    const balanceInfoStyle = { marginTop: '8px', borderTop: '1px dashed #000', paddingTop: '8px' };
    const hrStyle = { border: 'none', borderTop: '1px dashed #000', margin: '8px 0' };

    // --- Loading & Error States ---
    if (isLoading) {
        return ( <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3 }}> <CircularProgress /> <Typography sx={{ mt: 2 }}>Loading receipt details...</Typography> </Box> );
    }
    if (isError) {
        return <Typography color="error" sx={{ p: 3, textAlign: 'center', fontFamily: '"Courier New", Courier, monospace' }}>Error loading receipt: {error?.response?.data?.error || error?.message || 'Not Found or Network Error'}</Typography>;
    }
    if (!receiptData) { // Fallback if data is null/undefined after loading without error
        return <Typography color="error" sx={{ p: 3, textAlign: 'center', fontFamily: '"Courier New", Courier, monospace' }}>Error: Receipt data could not be loaded or is invalid.</Typography>;
    }

    // --- Render Specific Receipt Types ---

    // 1. SALE
    if (receiptData.type === 'SALE') {
        const title = 'Sales Receipt';
        // Use populated customer name, fallback to random name
        const customerName = receiptData.customer?.name || receiptData.randomCustomerName || 'Random Customer';
        // Validate items array
        if (!Array.isArray(receiptData.items)) {
             console.error('Receipt Error: SALE type missing or invalid "items" array.', receiptData);
             return <Typography color="error" sx={{p:3}}>Error: Invalid sale items data.</Typography>;
        }

        return (
            <div id="receipt-container" style={receiptStyles}>
                <ReceiptHeader />
                <h2 style={{ textAlign: 'center', margin: '0 0 10px 0', fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase' }}>{title}</h2>
                <p><strong>Date:</strong> {new Date(receiptData.createdAt || Date.now()).toLocaleString()}</p>
                <p><strong>Customer:</strong> {customerName}</p>
                {receiptData.paymentMethod && <p><strong>Payment:</strong> {receiptData.paymentMethod}</p>}
                <hr style={hrStyle} />
                <table style={tableStyles}>
                    <thead><tr><th style={thStyles}>Item</th><th style={{...thStyles,...alignCenter}}>Qty</th><th style={{...thStyles,...alignRight}}>Total</th></tr></thead>
                    <tbody>{receiptData.items.map((item, index) => {
                            // Use populated product name if available, fallback to stored name
                            const itemName = item?.product?.name || item?.name || 'Unknown Item';
                            const itemQty = item?.quantity ?? '-';
                            const itemPrice = parseFloat(item?.price) || 0; // Price per unit
                            const lineTotal = itemPrice * (parseInt(itemQty) || 0);
                            return (<tr key={index}><td style={tdStyles}>{itemName}</td><td style={{...tdStyles,...alignCenter}}>{itemQty}</td><td style={{...tdStyles,...alignRight}}>TK {lineTotal.toFixed(2)}</td></tr>);
                        })}</tbody>
                </table>
                <hr style={hrStyle} />
                <p style={totalLineStyle}>TOTAL: TK {(receiptData.amount ?? 0).toFixed(2)}</p>
                {/* Balance info only for registered customers */}
                {(receiptData.customer && receiptData.balanceBefore != null && receiptData.balanceAfter != null) && (
                    <div style={balanceInfoStyle}><hr style={hrStyle} /><p><strong>Prev Balance:</strong> TK {receiptData.balanceBefore.toFixed(2)}</p><p><strong>New Balance:</strong> TK {receiptData.balanceAfter.toFixed(2)}</p></div>)}
                <ReceiptFooter />
            </div> );
    }

    // 2. WHOLESALE_SALE
     if (receiptData.type === 'WHOLESALE_SALE') {
        const title = 'Wholesale Receipt';
        // Use populated buyer name
        const buyerName = receiptData.wholesaleBuyer?.name || 'Wholesale Buyer';
         // Validate customItems array
        if (!Array.isArray(receiptData.customItems)) {
            console.error('Receipt Error: WHOLESALE_SALE type missing or invalid "customItems" array.', receiptData);
            return <Typography color="error" sx={{p:3}}>Error: Invalid wholesale items data.</Typography>;
        }

        return (
            <div id="receipt-container" style={receiptStyles}>
                 <ReceiptHeader />
                 <h2 style={{ textAlign: 'center', margin: '0 0 10px 0', fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase' }}>{title}</h2>
                 <p><strong>Date:</strong> {new Date(receiptData.createdAt || Date.now()).toLocaleString()}</p>
                 <p><strong>Buyer:</strong> {buyerName}</p>
                 {receiptData.paymentMethod && <p><strong>Payment:</strong> {receiptData.paymentMethod}</p>}
                 <hr style={hrStyle} />
                <table style={tableStyles}>
                    <thead><tr><th style={thStyles}>Item</th><th style={{...thStyles,...alignCenter}}>Qty</th><th style={{...thStyles,...alignCenter}}>Weight</th><th style={{...thStyles,...alignRight}}>Price</th></tr></thead>
                    <tbody>{receiptData.customItems.map((item, index) => {
                            const itemName = item?.name || 'Unknown Item'; const itemQty = item?.quantity ?? '-'; const itemWeight = item?.weight; const itemTotalPrice = parseFloat(item?.price) || 0; // Price is total here
                            return (<tr key={index}><td style={tdStyles}>{itemName}</td><td style={{...tdStyles,...alignCenter}}>{itemQty}</td><td style={{...tdStyles,...alignCenter}}>{itemWeight != null ? `${itemWeight} kg` : '-'}</td><td style={{...tdStyles,...alignRight}}>TK {itemTotalPrice.toFixed(2)}</td></tr>);
                        })}</tbody>
                </table>
                 <hr style={hrStyle} />
                <p style={totalLineStyle}>TOTAL: TK {(receiptData.amount ?? 0).toFixed(2)}</p>
                {/* Balance info for wholesale buyer */}
                {(receiptData.balanceBefore != null && receiptData.balanceAfter != null) && (
                    <div style={balanceInfoStyle}><hr style={hrStyle} /><p><strong>Prev Balance:</strong> TK {receiptData.balanceBefore.toFixed(2)}</p><p><strong>New Balance:</strong> TK {receiptData.balanceAfter.toFixed(2)}</p></div>)}
                <ReceiptFooter />
            </div> );
    }

    // 3. DEPOSIT or WITHDRAWAL
    if (receiptData.type === 'DEPOSIT' || receiptData.type === 'WITHDRAWAL') {
        const amountValue = receiptData.amount ?? 0; const isDeposit = amountValue >= 0; const title = isDeposit ? 'Deposit Receipt' : 'Withdrawal Receipt'; const amountDisplay = Math.abs(amountValue);
        // Use populated name from either customer or wholesaleBuyer
        const accountName = receiptData.customer?.name || receiptData.wholesaleBuyer?.name || 'N/A';
        const balanceBefore = receiptData.balanceBefore ?? 0; const balanceAfter = receiptData.balanceAfter ?? 0;
        return (
             <div id="receipt-container" style={receiptStyles}>
                 <ReceiptHeader />
                 <h2 style={{ textAlign: 'center', margin: '0 0 10px 0', fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase' }}>{title}</h2>
                 <p><strong>Date:</strong> {new Date(receiptData.createdAt || Date.now()).toLocaleString()}</p>
                 <p><strong>Account:</strong> {accountName}</p> <hr style={hrStyle} />
                 <p style={{ fontSize: '1.2em', fontWeight: 'bold', margin: '10px 0' }}>AMOUNT: TK {amountDisplay.toFixed(2)}</p> <hr style={hrStyle} />
                 <div style={balanceInfoStyle}><p><strong>Prev Balance:</strong> TK {balanceBefore.toFixed(2)}</p><p><strong>New Balance:</strong> TK {balanceAfter.toFixed(2)}</p></div>
                 <ReceiptFooter />
             </div> );
    }

    // 4. BUY_BACK
    if (receiptData.type === 'BUY_BACK') {
         const quantity = receiptData.buyBackQuantity ?? '-'; const weight = receiptData.buyBackWeight ?? 0; const pricePerKg = receiptData.buyBackPricePerKg ?? 0; const totalAmount = receiptData.amount ?? 0; const balanceBefore = receiptData.balanceBefore ?? 0; const balanceAfter = receiptData.balanceAfter ?? 0;
         // Use populated customer name
         const customerName = receiptData.customer?.name || 'N/A';
        return (
            <div id="receipt-container" style={receiptStyles}>
                 <ReceiptHeader />
                 <h2 style={{ textAlign: 'center', margin: '0 0 10px 0', fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase' }}>Buy Back Receipt</h2>
                 <p><strong>Date:</strong> {new Date(receiptData.createdAt || Date.now()).toLocaleString()}</p>
                 <p><strong>Customer:</strong> {customerName}</p>
                 {receiptData.referenceName && <p><strong>Reference:</strong> {receiptData.referenceName}</p>} <hr style={hrStyle} />
                 <div style={{ margin: '10px 0' }}><p><strong>Chickens (Qty):</strong> {quantity}</p><p><strong>Total Weight:</strong> {weight.toFixed(2)} kg</p><p><strong>Price per Kg:</strong> TK {pricePerKg.toFixed(2)}</p></div> <hr style={hrStyle} />
                 <p style={totalLineStyle}>TOTAL CREDIT: TK {totalAmount.toFixed(2)}</p> <hr style={hrStyle} />
                 <div style={balanceInfoStyle}><p><strong>Prev Balance:</strong> TK {balanceBefore.toFixed(2)}</p><p><strong>New Balance:</strong> TK {balanceAfter.toFixed(2)}</p></div>
                 <ReceiptFooter />
            </div> );
    }

    // Fallback for unexpected types after loading
    console.error('ReceiptPage: Invalid or unknown receipt type received:', receiptData?.type);
    return <Typography color="error" sx={{ p: 3, textAlign: 'center' }}>Error: Could not display receipt. Invalid data type "{receiptData?.type || 'unknown'}".</Typography>;
};

export default ReceiptPage;