/**
 * Opens a new window and prints the provided HTML content using standard document styles.
 * @param {string} htmlContent - The HTML string to be printed.
 * @param {string} title - The title for the print window document.
 */
export const printHtml = (htmlContent, title) => {
    const printWindow = window.open('', '_blank', 'height=800,width=800');
    printWindow.document.write('<html><head><title>' + (title || 'Print') + '</title>');
    printWindow.document.write('<link rel="stylesheet" href="/src/index.css" type="text/css" />');
    printWindow.document.write(`
        <style>
            @page { size: auto; margin: 20mm; }
            body { padding: 20px; font-family: sans-serif; color: #000; }
            .no-print { display: none !important; }
            table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            h3.print-total { text-align: right; font-size: 1.2em; border-top: 2px solid black; padding-top: 10px; margin-top: 15px; }
        </style>
    `);
    printWindow.document.write('</head><body>' + htmlContent + '</body></html>');
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
};

/**
 * Opens a new window and prints HTML content with styles optimized for a thermal receipt printer.
 * @param {string} htmlContent - The HTML string of the receipt to be printed.
 * @param {string} title - The title for the print window document.
 */
export const printThermalReceipt = (htmlContent, title) => {
    const printWindow = window.open('', '_blank', 'height=800,width=600');
    printWindow.document.write('<html><head><title>' + (title || 'Receipt') + '</title>');
    printWindow.document.write(`
        <style>
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
            #receipt-container { width: 100%; margin: 0; padding: 0; box-shadow: none; border: none; }
            h1, h2, p { margin: 0; padding: 0; }
            .receipt-header { text-align: center; margin-bottom: 15px; }
            .receipt-header h1 { font-size: 18px; font-weight: bold; margin-bottom: 2px; }
            .receipt-header p { font-size: 12px; line-height: 1.4; }
            .receipt-title { text-align: center; margin: 0 0 10px 0; font-size: 14px; font-weight: bold; text-transform: uppercase; }
            hr { border: none; border-top: 1px dashed #000; margin: 8px 0; }
            table { width: 100%; font-size: 12px; border-collapse: collapse; }
            thead th { text-align: left; border-bottom: 1px dashed #000; padding-bottom: 4px; }
            tbody td { padding: 4px 0; }
            .align-center { text-align: center; }
            .align-right { text-align: right; }
            .total-line { text-align: right; font-size: 1.1em; font-weight: bold; }
            .balance-info p { margin-bottom: 4px; }
            .signature-area { margin-top: 30px; padding-top: 40px; border-top: 1px dashed #000; text-align: right; }
            #print-button { display: none !important; }
            .no-print { display: none !important; }
        </style>
    `);
    printWindow.document.write('</head><body>');
    printWindow.document.write(htmlContent);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
};