const express = require("express");
const pool = require("../db");
const adminAuth = require("../middleware/adminAuth");

const router = express.Router();

// All booking management routes require admin authentication.
router.use(adminAuth);

// GET all bookings
router.get("/", async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT *
             FROM bookings
             ORDER BY created_at DESC`
        );

        res.json({
            success: true,
            bookings: result.rows
        });
    } catch (error) {
        console.error("Get bookings error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to fetch bookings."
        });
    }
});

// GET one booking
router.get("/:id", async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT *
             FROM bookings
             WHERE id = $1`,
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Booking not found."
            });
        }

        res.json({
            success: true,
            booking: result.rows[0]
        });
    } catch (error) {
        console.error("Get booking error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to fetch booking."
        });
    }
});

// UPDATE booking status or payment status
router.patch("/:id", async (req, res) => {
    const { status, payment_status } = req.body;

    const allowedStatuses = [
        "pending",
        "confirmed",
        "completed",
        "cancelled"
    ];

    const allowedPaymentStatuses = [
        "pending",
        "paid"
    ];

    if (status && !allowedStatuses.includes(status)) {
        return res.status(400).json({
            success: false,
            message: "Invalid booking status."
        });
    }

    if (payment_status && !allowedPaymentStatuses.includes(payment_status)) {
        return res.status(400).json({
            success: false,
            message: "Invalid payment status."
        });
    }

    if (!status && !payment_status) {
        return res.status(400).json({
            success: false,
            message: "No fields provided to update."
        });
    }

    try {
        let query, params;
        if (status && payment_status) {
            query = `UPDATE bookings SET status = $1, payment_status = $2 WHERE id = $3 RETURNING *`;
            params = [status, payment_status, req.params.id];
        } else if (status) {
            query = `UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *`;
            params = [status, req.params.id];
        } else {
            query = `UPDATE bookings SET payment_status = $1 WHERE id = $2 RETURNING *`;
            params = [payment_status, req.params.id];
        }

        const result = await pool.query(query, params);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Booking not found."
            });
        }

        res.json({
            success: true,
            message: "Booking updated successfully.",
            booking: result.rows[0]
        });
    } catch (error) {
        console.error("Update booking error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to update booking."
        });
    }
});

// DELETE booking
router.delete("/:id", async (req, res) => {
    try {
        const result = await pool.query(
            `DELETE FROM bookings
             WHERE id = $1
             RETURNING id`,
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Booking not found."
            });
        }

        res.json({
            success: true,
            message: "Booking deleted."
        });
    } catch (error) {
        console.error("Delete booking error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to delete booking."
        });
    }
});

module.exports = router;
