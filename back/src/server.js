require("dotenv").config();

const express = require("express");
const cors = require("cors");

const {
    addAdminClient,
    removeAdminClient
} = require("./notifications");

const app = express();
const adminAuth = require("./middleware/adminAuth");
const PORT = process.env.PORT || 5000;

const contactRoutes = require("./routes/contact");
const bookingsRoutes = require("./routes/bookings");

// CORS
app.use(cors({
    origin: [
        "https://harrison1-m.github.io",
        "http://localhost:8001",
        "http://127.0.0.1:8001"
    ]
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

// =========================================
// START SERVER
// =========================================

app.listen(PORT, () => {
    console.log(`Hensil backend running on port ${PORT}`);
});