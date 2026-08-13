const express = require("express");
const pool = require("../db");

const router = express.Router();

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

// UPDATE booking status
router.patch("/:id", async (req, res) => {
    const { status } = req.body;

    const allowedStatuses = [
        "pending",
        "confirmed",
        "completed",
        "cancelled"
    ];

    if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
            success: false,
            message: "Invalid booking status."
        });
    }

    try {
        const result = await pool.query(
            `UPDATE bookings
             SET status = $1
             WHERE id = $2
             RETURNING *`,
            [status, req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Booking not found."
            });
        }

        res.json({
            success: true,
            message: "Booking status updated.",
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
