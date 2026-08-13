const express = require("express");
const pool = require("../db");

const router = express.Router();

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

    try {
        const result = await pool.query(
            `INSERT INTO bookings
                (name, email, phone, service, booking_date, message)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id, name, email, phone, service, booking_date, message, status, created_at`,
            [
                name,
                email,
                phone || null,
                service,
                date,
                message
            ]
        );

        console.log("New booking saved:");
        console.log(result.rows[0]);

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
