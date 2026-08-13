require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

const contactRoutes = require("./routes/contact");
const bookingsRoutes = require("./routes/bookings");

// CORS — allow our frontend
app.use(cors({
    origin: process.env.FRONTEND_URL
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

app.listen(PORT, () => {
    console.log(`Hensil backend running on port ${PORT}`);
});
