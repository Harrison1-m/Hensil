const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const multer = require("multer");
const pool = require("../db");
const adminAuth = require("../middleware/adminAuth");

const router = express.Router();

const STORAGE_DIR = path.join(__dirname, "../../storage/originals");
const PREVIEW_DIR = path.join(__dirname, "../../storage/previews");

if (!fs.existsSync(STORAGE_DIR)) fs.mkdirSync(STORAGE_DIR, { recursive: true });
if (!fs.existsSync(PREVIEW_DIR)) fs.mkdirSync(PREVIEW_DIR, { recursive: true });

const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, STORAGE_DIR);
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
            cb(null, uniqueSuffix + path.extname(file.originalname));
        }
    }),
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

const LICENSE_SECRET = process.env.LICENSE_SECRET || "hensil-secure-license-secret-key";

function generateLicenseToken(mediaId, phone) {
    const data = `${mediaId}:${phone}:${Date.now()}`;
    const sig = crypto.createHmac("sha256", LICENSE_SECRET).update(data).digest("hex");
    return Buffer.from(`${data}:${sig}`).toString("base64");
}

function verifyLicenseToken(token, mediaId) {
    try {
        const decoded = Buffer.from(token, "base64").toString("utf8");
        const [mId, phone, timestamp, sig] = decoded.split(":");
        if (mId !== mediaId) return false;
        const data = `${mId}:${phone}:${timestamp}`;
        const expectedSig = crypto.createHmac("sha256", LICENSE_SECRET).update(data).digest("hex");
        return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig));
    } catch (err) {
        return false;
    }
}

// GET /api/media - Cursor-based infinite scroll (Latest first)
router.get("/", async (req, res) => {
    try {
        const { cursor, category, limit = 12 } = req.query;
        const parsedLimit = parseInt(limit, 10) || 12;

        let query = `
            SELECT id, title, category, type, price, preview_path, is_locked, created_at
            FROM media_assets
            WHERE ($1::timestamp IS NULL OR created_at < $1)
            AND ($2::text IS NULL OR category = $2)
            ORDER BY created_at DESC
            LIMIT $3 + 1
        `;

        const values = [cursor || null, category || null, parsedLimit];
        const result = await pool.query(query, values);

        const rows = result.rows;
        let hasMore = false;
        if (rows.length > parsedLimit) {
            hasMore = true;
            rows.pop(); // Remove extra row
        }

        res.json({
            data: rows,
            nextCursor: rows.length > 0 ? rows[rows.length - 1].created_at : null,
            hasMore
        });
    } catch (err) {
        console.error("Error fetching media:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// POST /api/media - Admin upload media
router.post("/", adminAuth, upload.single("file"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        const { title, category = "general", type = "image", price = 0, is_locked = "true" } = req.body;
        const originalPath = req.file.filename;
        const isLockedBool = is_locked === "true" || is_locked === true;

        const query = `
            INSERT INTO media_assets (title, category, type, price, original_path, preview_path, is_locked)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id, title, category, type, price, original_path, preview_path, is_locked, created_at
        `;

        const values = [
            title || req.file.originalname,
            category,
            type,
            parseFloat(price) || 0,
            originalPath,
            originalPath, // preview path defaults to original for now (watermarked on client/rendering)
            isLockedBool
        ];

        const result = await pool.query(query, values);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("Error uploading media:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// GET /api/media/download/:id - Secure download endpoint
router.get("/download/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { token, phone } = req.query;

        const mediaResult = await pool.query("SELECT * FROM media_assets WHERE id = $1", [id]);
        if (mediaResult.rows.length === 0) {
            return res.status(404).json({ error: "Media asset not found" });
        }

        const asset = mediaResult.rows[0];

        // SEO and headers
        if (asset.is_locked) {
            res.setHeader("X-Robots-Tag", "noindex, nofollow");
            // Check if user has valid license token or if paid via transaction
            let authorized = false;
            if (token && verifyLicenseToken(token, id)) {
                authorized = true;
            } else if (phone) {
                // Check completed transaction in DB
                const txResult = await pool.query(
                    "SELECT * FROM transactions WHERE media_id = $1 AND phone = $2 AND status = 'completed'",
                    [id, phone]
                );
                if (txResult.rows.length > 0) {
                    authorized = true;
                }
            }

            if (!authorized) {
                return res.status(403).json({ error: "Access denied. Payment required or invalid license token." });
            }
        } else {
            // Unlocked media is SEO friendly
            res.setHeader("X-Robots-Tag", "index, follow");
        }

        const filePath = path.join(STORAGE_DIR, asset.original_path);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: "File not found on server storage" });
        }

        res.download(filePath, asset.title + path.extname(asset.original_path));
    } catch (err) {
        console.error("Error downloading media:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;
module.exports.generateLicenseToken = generateLicenseToken;
