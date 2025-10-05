import React, { useEffect, useState } from 'react';

const ReceiptPage = () => {
  const [receiptData, setReceiptData] = useState(null);

  useEffect(() => {
    const data = sessionStorage.getItem('receiptData');
    console.log("RECEIPT DATA RECEIVED:", data);
    if (data) {
      setReceiptData(JSON.parse(data));
    }
  }, []);

  if (!receiptData) {
    return <p>Loading receipt...</p>;
  }

  const receiptStyles = {
    width: '320px',
    margin: '40px auto',
    padding: '20px',
    border: '1px solid #ccc',
    fontFamily: '"Courier New", Courier, monospace',
    boxShadow: '0 0 10px rgba(0,0,0,0.1)',
  };
  const hrStyle = { border: 'none', borderTop: '1px dashed #333', margin: '10px 0' };
  const buttonContainerStyle = { textAlign: 'center', marginTop: '20px' };

  const printReceipt = () => {
    const printContent = document.getElementById('receipt-container');
    const printWindow = window.open('', '_blank', 'height=800,width=600');
    
    printWindow.document.write('<html><head><title></title>');
    
    // Link to your main CSS file to keep the table and text styling
    printWindow.document.write('<link rel="stylesheet" href="/index.css" type="text/css" />');
    

    // Add specific styles for the pop-up window
    printWindow.document.write(`
            <style>
                @page {
                    size: auto;
                    margin: 0mm; /* This removes the browser's default headers and footers */
                }
                body { 
                    padding: 20px; 
                }
                #print-button, .developed-by-tag, .app-footer { 
                    display: none; 
                }
                #receipt-container { 
                    width: 100% !important; 
                    margin: 0; 
                    padding: 0; 
                    box-shadow: none; 
                    border: none; 
                }
            </style>
        `);    
    printWindow.document.write('</head><body>');
    printWindow.document.write(printContent.innerHTML);
    printWindow.document.write('</body></html>');
    
    printWindow.document.close();
    printWindow.focus(); // Necessary for some browsers
    
    // Use a timeout to ensure content and styles are loaded before printing
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 500);
};

  // Render a Sales Receipt
  if (receiptData.type === 'sale') {
    return (
      <div id="receipt-container" style={receiptStyles}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h1 style={{ margin: '0', fontSize: '24px' }}>Fahim Poultry Feed</h1>
        <p style={{ margin: '5px 0' }}>Pubali Bazar,Ghorashal Santanpara, Palash, Narsingdi</p>
        <p style={{ margin: '5px 0' }}>Phone: 01743681401</p>
      </div>
        <h2 style={{ textAlign: 'center', margin: '0 0 10px 0' }}>SALES RECEIPT</h2>
        <p><strong>Date:</strong> {new Date(receiptData.date).toLocaleString()}</p>
        <p><strong>Customer:</strong> {receiptData.customerName}</p>
        <hr style={hrStyle} />
        <table style={{ width: '100%', fontSize: '14px' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Item</th>
              <th style={{ textAlign: 'center' }}>Qty</th>
              <th style={{ textAlign: 'right' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {receiptData.items.map((item, index) => (
              <tr key={index}>
                <td>{item.name}</td>
                <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                <td style={{ textAlign: 'right' }}>TK {(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <hr style={hrStyle} />
        <p style={{ textAlign: 'right', fontSize: '1.2em' }}><strong>TOTAL: TK {receiptData.totalAmount.toFixed(2)}</strong></p>
        <hr style={hrStyle} />
        {receiptData.balanceBefore != null && receiptData.balanceAfter != null && (
        <>
        <p><strong>Previous Balance:</strong> TK {receiptData.balanceBefore.toFixed(2)}</p>
        <p><strong>New Balance:</strong> TK {receiptData.balanceAfter.toFixed(2)}</p>
        </>
        )}
        <div style={{ marginTop: '30px', paddingTop: '50px', borderTop: '1px dashed #333', textAlign: 'right' }}>
        <p style={{ margin: '0' }}>_________________________</p>
        <p style={{ margin: '5px 0 0 0' }}>Authorized Signature</p>
        </div>
        <div style={buttonContainerStyle}>
            <button id="print-button" onClick={printReceipt} className="button-primary">Print Receipt</button>
        </div>
      </div>
    );
  }

  // Render a Deposit/Withdrawal Receipt
  if (receiptData.type === 'deposit') {
    const isDeposit = receiptData.depositAmount >= 0;
    return (
      <div id="receipt-container" style={receiptStyles}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h1 style={{ margin: '0', fontSize: '24px' }}>Fahim Poultry Feed</h1>
        <p style={{ margin: '5px 0' }}>Pubali Bazar,Ghorashal Santanpara, Palash, Narsingdi</p>
        <p style={{ margin: '5px 0' }}>Phone: 01743681401</p>
      </div>
        <h2 style={{ textAlign: 'center', margin: '0 0 10px 0' }}>{isDeposit ? 'DEPOSIT RECEIPT' : 'WITHDRAWAL RECEIPT'}</h2>
        <p><strong>Date:</strong> {new Date(receiptData.date).toLocaleString()}</p>
        <p><strong>Customer:</strong> {receiptData.customerName}</p>
        <hr style={hrStyle} />
        <p style={{ fontSize: '1.2em' }}>
            <strong>AMOUNT: TK {Math.abs(receiptData.depositAmount).toFixed(2)}</strong>
        </p>
        <hr style={hrStyle} />
        <p><strong>Previous Balance:</strong> TK {receiptData.balanceBefore.toFixed(2)}</p>
        <p><strong>New Balance:</strong> TK {receiptData.balanceAfter.toFixed(2)}</p>
        <div style={{ marginTop: '30px', paddingTop: '50px', borderTop: '1px dashed #333', textAlign: 'right' }}>
        <p style={{ margin: '0' }}>_________________________</p>
        <p style={{ margin: '5px 0 0 0' }}>Authorized Signature</p>
        </div>
        <div style={buttonContainerStyle}>
            <button id="print-button" onClick={printReceipt} className="button-primary">Print Receipt</button>
        </div>
      </div>
    );
  }

//Buy back Receipt
if (receiptData.type === 'buy_back') {
    return (
      <div id="receipt-container" style={receiptStyles}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <h1 style={{ margin: '0', fontSize: '24px' }}>Fahim Poultry Feed</h1>
            <p style={{ margin: '5px 0' }}>Pubali Bazar,Ghorashal Palash,Narsingdi</p>
            <p style={{ margin: '5px 0' }}>Phone: 01743681401</p>
        </div>
        <h2 style={{ textAlign: 'center', margin: '0 0 10px 0' }}>BUY BACK RECEIPT</h2>
        <p><strong>Date:</strong> {new Date(receiptData.date).toLocaleString()}</p>
        <p><strong>Customer:</strong> {receiptData.customerName}</p>
        {receiptData.referenceName && <p><strong>Reference:</strong> {receiptData.referenceName}</p>}
        <hr style={hrStyle} />
        <div style={{fontSize: '14px'}}>
            <p style={{ margin: '5px 0' }}><strong>Chickens (Qty):</strong> {receiptData.buyBackQuantity}</p>
            <p style={{ margin: '5px 0' }}><strong>Total Weight:</strong> {receiptData.buyBackWeight.toFixed(2)} kg</p>
            <p style={{ margin: '5px 0' }}><strong>Price per Kg:</strong> TK {receiptData.buyBackPricePerKg.toFixed(2)}</p>
        </div>
        <hr style={hrStyle} />
        <p style={{ textAlign: 'right', fontSize: '1.2em' }}><strong>TOTAL: TK {receiptData.totalAmount.toFixed(2)}</strong></p>
        <hr style={hrStyle} />
        <p><strong>Previous Balance:</strong> TK {receiptData.balanceBefore.toFixed(2)}</p>
        <p><strong>New Balance:</strong> TK {receiptData.balanceAfter.toFixed(2)}</p>
        
        <div style={{ marginTop: '30px', paddingTop: '50px', borderTop: '1px dashed #333', textAlign: 'right' }}>
          <p style={{ margin: '0' }}>_________________________</p>
          <p style={{ margin: '5px 0 0 0' }}>Authorized Signature</p>
        </div>

        <div style={buttonContainerStyle}>
            <button id="print-button" onClick={printReceipt} className="button-primary">Print Receipt</button>
        </div>
      </div>
    );
}

// --- ADD THIS ENTIRE BLOCK ---
  if (receiptData.type === 'wholesale_sale') {
    return (
      <div id="receipt-container" style={receiptStyles}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h1 style={{ margin: '0', fontSize: '24px' }}>Fahim Poultry Feed</h1>
          <p style={{ margin: '5px 0' }}>Pubali Bazar,Ghorashal Santanpara, Palash, Narsingdi</p>
          <p style={{ margin: '5px 0' }}>Phone: 01743681401</p>
        </div>
        <h2 style={{ textAlign: 'center', margin: '0 0 10px 0' }}>WHOLESALE RECEIPT</h2>
        <p><strong>Date:</strong> {new Date(receiptData.date).toLocaleString()}</p>
        <p><strong>Customer:</strong> {receiptData.customerName}</p>
        <hr style={hrStyle} />
        <table style={{ width: '100%', fontSize: '14px' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Item</th>
              <th style={{ textAlign: 'center' }}>Qty</th>
              <th style={{ textAlign: 'center' }}>Weight</th>
              <th style={{ textAlign: 'right' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {receiptData.items.map((item, index) => (
              <tr key={index}>
                <td>{item.name}</td>
                <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                <td style={{ textAlign: 'center' }}>{item.weight ? `${item.weight} kg` : '-'}</td>
                <td style={{ textAlign: 'right' }}>TK {parseFloat(item.price).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <hr style={hrStyle} />
        <p style={{ textAlign: 'right', fontSize: '1.2em' }}><strong>TOTAL: TK {receiptData.totalAmount.toFixed(2)}</strong></p>
        <hr style={hrStyle} />
        <p><strong>Previous Balance:</strong> TK {receiptData.balanceBefore.toFixed(2)}</p>
        <p><strong>New Balance:</strong> TK {receiptData.balanceAfter.toFixed(2)}</p>
        <div style={{ marginTop: '30px', paddingTop: '50px', borderTop: '1px dashed #333', textAlign: 'right' }}>
          <p style={{ margin: '0' }}>_________________________</p>
          <p style={{ margin: '5px 0 0 0' }}>Authorized Signature</p>
        </div>
        <div style={buttonContainerStyle}>
            <button id="print-button" onClick={printReceipt} className="button-primary">Print Receipt</button>
        </div>
      </div>
    );
  }

  return <p>Invalid receipt type.</p>;
};

export default ReceiptPage;