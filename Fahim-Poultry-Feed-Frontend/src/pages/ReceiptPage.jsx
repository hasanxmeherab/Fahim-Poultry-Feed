import React, { useEffect, useState } from 'react';

const ReceiptPage = () => {
  const [receiptData, setReceiptData] = useState(null);

  useEffect(() => {
    const data = sessionStorage.getItem('receiptData');
    if (data) {
      setReceiptData(JSON.parse(data));
    }
  }, []);

  const receiptStyles = {
    width: '320px',
    margin: '40px auto',
    padding: '20px',
    border: '1px solid #ccc',
    fontFamily: '"Courier New", Courier, monospace',
    boxShadow: '0 0 10px rgba(0,0,0,0.1)',
  };

  const printStyles = `
    @page {
      size: 80mm auto; /* Common thermal printer paper width */
      margin: 0mm;
    }
    body {
      margin: 0;
      padding: 15px;
      font-family: 'Courier New', Courier, monospace;
      font-size: 12px;
      color: #000;
    }
    #receipt-container {
      width: 100%;
      margin: 0;
      padding: 0;
      box-shadow: none;
      border: none;
    }
    h1, h2, p {
      margin: 0;
      padding: 0;
    }
    .receipt-header {
      text-align: center;
      margin-bottom: 15px;
    }
    .receipt-header h1 {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 2px;
    }
    .receipt-header p {
      font-size: 12px;
      line-height: 1.4;
    }
    .receipt-title {
      text-align: center;
      margin: 0 0 10px 0;
      font-size: 14px;
      font-weight: bold;
      text-transform: uppercase;
    }
    hr {
      border: none;
      border-top: 1px dashed #000;
      margin: 8px 0;
    }
    table {
      width: 100%;
      font-size: 12px;
      border-collapse: collapse;
    }
    thead th {
      text-align: left;
      border-bottom: 1px dashed #000;
      padding-bottom: 4px;
    }
    tbody td {
      padding: 4px 0;
    }
    .align-center { text-align: center; }
    .align-right { text-align: right; }
    .total-line {
      text-align: right;
      font-size: 1.1em;
      font-weight: bold;
    }
    .balance-info p {
      margin-bottom: 4px;
    }
    .signature-area {
      margin-top: 30px;
      padding-top: 40px;
      border-top: 1px dashed #000;
      text-align: right;
    }
    #print-button {
      display: none;
    }
  `;

  const printReceipt = () => {
    const printContent = document.getElementById('receipt-container').innerHTML;
    const printWindow = window.open('', '_blank', 'height=800,width=600');
    
    printWindow.document.write('<html><head><title>Receipt</title>');
    printWindow.document.write(`<style>${printStyles}</style>`);
    printWindow.document.write('</head><body>');
    printWindow.document.write(printContent);
    printWindow.document.write('</body></html>');
    
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 250);
  };

  const ReceiptHeader = () => (
    <div className="receipt-header">
      <h1>Fahim Poultry Feed</h1>
      <p>Pubali Bazar, Ghorashal Santanpara, Palash, Narsingdi</p>
      <p>Phone: 01743681401</p>
    </div>
  );

  const ReceiptFooter = () => (
    <>
      <div className="signature-area">
        <p>_________________________</p>
        <p style={{ marginTop: '5px' }}>Authorized Signature</p>
      </div>
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button id="print-button" onClick={printReceipt} style={{ padding: '10px 20px', cursor: 'pointer' }}>Print Receipt</button>
      </div>
    </>
  );

  if (!receiptData) {
    return <p>Loading receipt...</p>;
  }

  // --- RENDER BLOCKS ---

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