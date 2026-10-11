require("dotenv").config();

const express = require("express");
const cors = require("cors");

const {
    addAdminClient,
    removeAdminClient
} = require("./notifications");

const adminAuth = require("./middleware/adminAuth");
const contactRoutes = require("./routes/contact");
const bookingsRoutes = require("./routes/bookings");

const app = express();

// CORS
// The public frontend is hosted on GitHub Pages (https://harrison1-m.github.io/Hensil/)
// and calls this API cross-origin at https://178.162.254.195/api.
// Note: a CORS origin is scheme + host only (no /Hensil path).
const ALLOWED_ORIGINS = [
    "https://harrison1-m.github.io",
    "http://localhost:8001",
    "http://127.0.0.1:8001"
];

app.use(cors({
    origin: ALLOWED_ORIGINS
}));

app.use(express.json());

app.use("/api/contact", contactRoutes);
app.use("/api/bookings", bookingsRoutes);

app.get("/api/health", (req, res) => {
    res.json({
        status: "ok",
        message: "Hensil API is running"
    });
});

// =========================================
// ADMIN LIVE NOTIFICATIONS (SSE)
// =========================================

app.get("/api/admin/events", adminAuth, (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    res.flushHeaders();

    addAdminClient(res);

    req.on("close", () => {
        removeAdminClient(res);
    });
});

module.exports = app;
module.exports.ALLOWED_ORIGINS = ALLOWED_ORIGINS;
