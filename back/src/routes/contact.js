const express = require("express");
const pool = require("../db");
const { notifyAdmins } = require("../notifications");

const router = express.Router();

function getServiceAmount(service) {
    if (!service) return 3800.00;
    const lower = service.toLowerCase();
    if (lower.includes('mini') || lower.includes('portrait')) return 1500.00;
    if (lower.includes('elite') || lower.includes('campaign')) return 13200.00;
    return 3800.00;
}

router.post("/", async (req, res) => {
    const {
        name,
        email,
        phone,
        service,
        date,
        message
    } = req.body;

    // Validate required fields
    if (!name || !email || !service || !date || !message) {
        return res.status(400).json({
            success: false,
            message: "Please provide all required fields."
        });
    }

    const amount = getServiceAmount(service);

    try {
        const result = await pool.query(
            `INSERT INTO bookings
                (name, email, phone, service, booking_date, message, payment_status, amount)
             VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7)
             RETURNING id, name, email, phone, service, booking_date, message, status, payment_status, amount, created_at`,
            [
                name,
                email,
                phone || null,
                service,
                date,
                message,
                amount
            ]
        );

        console.log("New booking saved:");
        console.log(result.rows[0]);
        notifyAdmins(result.rows[0]);

        res.status(201).json({
            success: true,
            message: "Your booking inquiry has been received.",
            booking: result.rows[0]
        });

    } catch (error) {
        console.error("Database error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to save your booking inquiry."
        });
    }
});

module.exports = router;
