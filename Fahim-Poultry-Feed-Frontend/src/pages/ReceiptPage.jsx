import React, { useEffect, useState } from 'react';
import { printThermalReceipt } from '../utils/printUtils'; // Import the new utility

const ReceiptPage = () => {
    const [receiptData, setReceiptData] = useState(null);

    // This useEffect correctly gets data from sessionStorage and does NOT make an API call.
    useEffect(() => {
        const data = sessionStorage.getItem('receiptData');
        if (data) {
            setReceiptData(JSON.parse(data));
        }
    }, []);

    const handlePrint = () => {
        const receiptContent = document.getElementById('receipt-container');
        if (receiptContent) {
            printThermalReceipt(receiptContent.innerHTML, 'Receipt');
        }
    };

    const receiptStyles = {
        width: '320px',
        margin: '40px auto',
        padding: '20px',
        border: '1px solid #ccc',
        fontFamily: '"Courier New", Courier, monospace',
        boxShadow: '0 0 10px rgba(0,0,0,0.1)',
    };

    const ReceiptHeader = () => (
        <div className="receipt-header">
            <h1>Fahim Poultry Feed</h1>
            <p>Pubali Bazar, Ghorashal</p>
            <p>Santanpara, Palash, Narsingdi</p>
            <p>Phone: 01743681401</p>
        </div>
    );

    const ReceiptFooter = () => (
        <>
            <div className="signature-area">
                <p>_________________________</p>
                <p style={{ marginTop: '5px' }}>Authorized Signature</p>
            </div>
            <div style={{ textAlign: 'center', marginTop: '20px' }} className="no-print">
                <button id="print-button" onClick={handlePrint} style={{ padding: '10px 20px', cursor: 'pointer' }}>
                    Print Receipt
                </button>
            </div>
        </>
    );

    if (!receiptData) {
        return <p>Loading receipt data from session...</p>;
    }

    // --- Conditional Rendering for different receipt types ---

    if (receiptData.type === 'sale' || receiptData.type === 'wholesale_sale') {
        const isWholesale = receiptData.type === 'wholesale_sale';
        return (
            <div id="receipt-container" style={receiptStyles}>
                <ReceiptHeader />
                <h2 className="receipt-title">{isWholesale ? 'Wholesale Receipt' : 'Sales Receipt'}</h2>
                <p><strong>Date:</strong> {new Date(receiptData.date).toLocaleString()}</p>
                <p><strong>Customer:</strong> {receiptData.customerName}</p>
                <hr />
                <table>
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th className="align-center">Qty</th>
                            {isWholesale && <th className="align-center">Weight</th>}
                            <th className="align-right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {receiptData.items.map((item, index) => (
                            <tr key={index}>
                                <td>{item.name}</td>
                                <td className="align-center">{item.quantity}</td>
                                {isWholesale && <td className="align-center">{item.weight ? `${item.weight} kg` : '-'}</td>}
                                <td className="align-right">TK {parseFloat(isWholesale ? item.price : item.price * item.quantity).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <hr />
                <p className="total-line">TOTAL: TK {receiptData.totalAmount.toFixed(2)}</p>
                <hr />
                {(receiptData.balanceBefore != null && receiptData.balanceAfter != null) && (
                    <div className="balance-info">
                        <p><strong>Previous Balance:</strong> TK {receiptData.balanceBefore.toFixed(2)}</p>
                        <p><strong>New Balance:</strong> TK {receiptData.balanceAfter.toFixed(2)}</p>
                    </div>
                )}
                <ReceiptFooter />
            </div>
        );
    }

    if (receiptData.type === 'deposit') {
        const isDeposit = receiptData.depositAmount >= 0;
        return (
            <div id="receipt-container" style={receiptStyles}>
                <ReceiptHeader />
                <h2 className="receipt-title">{isDeposit ? 'Deposit Receipt' : 'Withdrawal Receipt'}</h2>
                <p><strong>Date:</strong> {new Date(receiptData.date).toLocaleString()}</p>
                <p><strong>Customer:</strong> {receiptData.customerName}</p>
                <hr />
                <p style={{ fontSize: '1.2em' }}><strong>AMOUNT: TK {Math.abs(receiptData.depositAmount).toFixed(2)}</strong></p>
                <hr />
                <div className="balance-info">
                    <p><strong>Previous Balance:</strong> TK {receiptData.balanceBefore.toFixed(2)}</p>
                    <p><strong>New Balance:</strong> TK {receiptData.balanceAfter.toFixed(2)}</p>
                </div>
                <ReceiptFooter />
            </div>
        );
    }

    if (receiptData.type === 'buy_back') {
        return (
            <div id="receipt-container" style={receiptStyles}>
                <ReceiptHeader />
                <h2 className="receipt-title">Buy Back Receipt</h2>
                <p><strong>Date:</strong> {new Date(receiptData.date).toLocaleString()}</p>
                <p><strong>Customer:</strong> {receiptData.customerName}</p>
                {receiptData.referenceName && <p><strong>Reference:</strong> {receiptData.referenceName}</p>}
                <hr />
                <div>
                    <p><strong>Chickens (Qty):</strong> {receiptData.buyBackQuantity}</p>
                    <p><strong>Total Weight:</strong> {receiptData.buyBackWeight.toFixed(2)} kg</p>
                    <p><strong>Price per Kg:</strong> TK {receiptData.buyBackPricePerKg.toFixed(2)}</p>
                </div>
                <hr />
                <p className="total-line">TOTAL: TK {receiptData.totalAmount.toFixed(2)}</p>
                <hr />
                <div className="balance-info">
                    <p><strong>Previous Balance:</strong> TK {receiptData.balanceBefore.toFixed(2)}</p>
                    <p><strong>New Balance:</strong> TK {receiptData.balanceAfter.toFixed(2)}</p>
                </div>
                <ReceiptFooter />
            </div>
        );
    }

    return <p>Invalid receipt type.</p>;
};

export default ReceiptPage;