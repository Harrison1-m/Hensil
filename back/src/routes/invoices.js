const express = require("express");
const pool = require("../db");

const router = express.Router();

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function getInvoiceNumber(booking) {
    const d = new Date(booking.created_at || Date.now());
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const seq = String(booking.id).padStart(3, '0');
    return `HNS-${year}${month}${day}-${seq}`;
}

router.get("/:id", async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM bookings WHERE id = $1`,
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).send(`
                <!DOCTYPE html>
                <html>
                <head><title>Invoice Not Found</title></head>
                <body style="font-family: sans-serif; text-align: center; padding: 50px;">
                    <h1>Invoice Not Found</h1>
                    <p>The requested invoice could not be found.</p>
                </body>
                </html>
            `);
        }

        const booking = result.rows[0];
        const invoiceNo = getInvoiceNumber(booking);
        const isPaid = booking.payment_status === 'paid';

        const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Hensil Studio Invoice ${invoiceNo}</title>
    <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; margin: 40px; color: #111; background: #fff; }
        .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0, 0, 0, 0.05); }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #333; padding-bottom: 20px; }
        .logo { font-size: 24px; font-weight: bold; letter-spacing: 2px; }
        .invoice-details { margin-top: 20px; display: flex; justify-content: space-between; }
        table { width: 100%; margin-top: 30px; border-collapse: collapse; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f9f9f9; }
        .total { text-align: right; margin-top: 20px; font-size: 18px; font-weight: bold; }
        .status { display: inline-block; padding: 6px 12px; border-radius: 4px; font-weight: bold; font-size: 14px; text-transform: uppercase; }
        .status.pending { background: #fff3cd; color: #856404; }
        .status.paid { background: #d4edda; color: #155724; }
        .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 20px; }
        .print-btn { display: block; margin: 20px auto; padding: 10px 20px; background: #c9a227; color: #111; border: none; font-weight: bold; border-radius: 4px; cursor: pointer; }
        @media print { .print-btn { display: none; } }
    </style>
</head>
<body>
    <div class="invoice-box">
        <div class="header">
            <div class="logo">HENSIL STUDIO</div>
            <div>
                <h2>INVOICE ${invoiceNo}</h2>
                <p>Date: ${new Date(booking.created_at || Date.now()).toLocaleDateString()}</p>
            </div>
        </div>
        <div class="invoice-details">
            <div>
                <strong>Billed To:</strong><br>
                ${escapeHtml(booking.name)}<br>
                Email: ${escapeHtml(booking.email)}<br>
                Phone: ${escapeHtml(booking.phone || 'N/A')}
            </div>
            <div>
                <strong>Payment Status:</strong><br>
                <span class="status ${booking.payment_status || 'pending'}">${booking.payment_status || 'pending'}</span>
            </div>
        </div>
        <table>
            <thead>
                <tr>
                    <th>Service / Description</th>
                    <th>Date</th>
                    <th>Amount (Ksh)</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>${escapeHtml(booking.service)}<br><small>${escapeHtml(booking.message || '')}</small></td>
                    <td>${new Date(booking.booking_date).toLocaleDateString()}</td>
                    <td>Ksh ${Number(booking.amount || 3800).toLocaleString()}</td>
                </tr>
            </tbody>
        </table>
        <div class="total">
            Total Due: Ksh ${Number(booking.amount || 3800).toLocaleString()}
        </div>
        <div style="margin-top: 30px; font-size: 14px;">
            <p><strong>Payment Instructions:</strong></p>
            ${isPaid ? '<p style="color: #155724; font-weight: bold;">Paid in full. Thank you for your business!</p>' : '<p>50% non-refundable retainer required to confirm booking date. Remaining balance due 7 days prior to execution.</p>'}
        </div>
        <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
        <div class="footer">
            <p>Hencil Creative Photography & Media Production Studio &bull; info@hensilstudio.com</p>
        </div>
    </div>
</body>
</html>`;

        res.send(html);
    } catch (error) {
        console.error("Get invoice error:", error);
        res.status(500).send("Unable to load invoice.");
    }
});

module.exports = router;
