const express = require("express");
const axios = require("axios");
const pool = require("../db");
const { generateLicenseToken } = require("./media");

const router = express.Router();

// Helper to get Daraja OAuth token
async function getDarajaAccessToken() {
    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    const env = process.env.MPESA_ENV || "sandbox";
    
    if (!consumerKey || !consumerSecret) {
        throw new Error("Daraja credentials not configured");
    }

    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");
    const url = env === "production"
        ? "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
        : "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";

    const response = await axios.get(url, {
        headers: { Authorization: `Basic ${auth}` }
    });
    return response.data.access_token;
}

// POST /api/payment/stk-push - Initiate M-Pesa STK Push
router.post("/stk-push", async (req, res) => {
    try {
        const { mediaId, phone } = req.body;
        if (!mediaId || !phone) {
            return res.status(400).json({ error: "mediaId and phone are required" });
        }

        const mediaResult = await pool.query("SELECT * FROM media_assets WHERE id = $1", [mediaId]);
        if (mediaResult.rows.length === 0) {
            return res.status(404).json({ error: "Media asset not found" });
        }

        const asset = mediaResult.rows.get ? mediaResult.rows.get(0) : mediaResult.rows[0];
        const amount = Math.round(parseFloat(asset.price) || 1); // Minimum KES 1

        // If Daraja credentials are not set in development, simulate a successful sandbox STK push
        const isSimulated = !process.env.MPESA_CONSUMER_KEY || process.env.MPESA_SIMULATE === "true";
        let checkoutRequestId = "sim_checkout_" + Date.now();
        let merchantRequestId = "sim_merchant_" + Date.now();

        if (!isSimulated) {
            const accessToken = await getDarajaAccessToken();
            const timestamp = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14);
            const shortcode = process.env.MPESA_SHORTCODE || "174379";
            const passkey = process.env.MPESA_PASSKEY;
            const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");
            const env = process.env.MPESA_ENV || "sandbox";
            const callbackUrl = process.env.MPESA_CALLBACK_URL;

            const url = env === "production"
                ? "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest"
                : "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest";

            const payload = {
                BusinessShortCode: shortcode,
                Password: password,
                Timestamp: timestamp,
                TransactionType: "CustomerPayBillOnline",
                Amount: amount,
                PartyA: phone,
                PartyB: shortcode,
                PhoneNumber: phone,
                CallBackURL: callbackUrl,
                AccountReference: "Hensil Studio",
                TransactionDesc: `Payment for ${asset.title}`
            };

            const stkResponse = await axios.post(url, payload, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });

            checkoutRequestId = stkResponse.data.CheckoutRequestID;
            merchantRequestId = stkResponse.data.MerchantRequestID;
        }

        // Insert pending transaction
        await pool.query(
            `INSERT INTO transactions (checkout_request_id, merchant_request_id, media_id, phone, amount, status)
             VALUES ($1, $2, $3, $4, $5, 'pending')`,
            [checkoutRequestId, merchantRequestId, mediaId, phone, amount]
        );

        // If simulated, auto-complete transaction after 3 seconds for easy local testing
        if (isSimulated) {
            setTimeout(async () => {
                await pool.query(
                    `UPDATE transactions SET status = 'completed', mpesa_receipt = $1 WHERE checkout_request_id = $2`,
                    ["SIM_RECEIPT_" + Math.random().toString(36).substring(7).toUpperCase(), checkoutRequestId]
                );
            }, 3000);
        }

        res.json({
            success: true,
            checkoutRequestId,
            message: "STK push initiated successfully. Enter your M-Pesa PIN."
        });
    } catch (err) {
        console.error("Error initiating STK push:", err.response?.data || err.message);
        res.status(500).json({ error: "Failed to initiate M-Pesa STK push", details: err.response?.data || err.message });
    }
});

// POST /api/payment/callback - Safaricom callback webhook
router.post("/callback", async (req, res) => {
    try {
        const body = req.body;
        const stkCallback = body?.Body?.stkCallback;
        if (!stkCallback) {
            return res.status(400).json({ error: "Invalid callback payload" });
        }

        const checkoutRequestId = stkCallback.CheckoutRequestID;
        const resultCode = stkCallback.ResultCode;

        if (resultCode === 0) {
            // Success
            let mpesaReceipt = "";
            const callbackItems = stkCallback.CallbackMetadata?.Item || [];
            for (const item of callbackItems) {
                if (item.Name === "MpesaReceiptNumber") {
                    mpesaReceipt = item.Value;
                }
            }

            await pool.query(
                `UPDATE transactions SET status = 'completed', mpesa_receipt = $1 WHERE checkout_request_id = $2`,
                [mpesaReceipt, checkoutRequestId]
            );
        } else {
            // Failed / Cancelled
            await pool.query(
                `UPDATE transactions SET status = 'failed' WHERE checkout_request_id = $1`,
                [checkoutRequestId]
            );
        }

        res.json({ ResultCode: 0, ResultDesc: "Success" });
    } catch (err) {
        console.error("Error handling M-Pesa callback:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// GET /api/payment/status/:checkoutId - Poll payment status
router.get("/status/:checkoutId", async (req, res) => {
    try {
        const { checkoutId } = req.params;
        const txResult = await pool.query("SELECT * FROM transactions WHERE checkout_request_id = $1", [checkoutId]);

        if (txResult.rows.length === 0) {
            return res.status(404).json({ error: "Transaction not found" });
        }

        const tx = txResult.rows[0];
        let token = null;

        if (tx.status === "completed") {
            token = generateLicenseToken(tx.media_id, tx.phone);
        }

        res.json({
            status: tx.status,
            mediaId: tx.media_id,
            phone: tx.phone,
            token
        });
    } catch (err) {
        console.error("Error checking payment status:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;
