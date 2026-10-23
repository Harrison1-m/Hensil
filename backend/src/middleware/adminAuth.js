const crypto = require("crypto");

function getToken(req) {
    const auth = req.headers.authorization;

    if (auth && auth.startsWith("Bearer ")) {
        return auth.slice(7).trim();
    }

    return req.query.token || "";
}

function adminAuth(req, res, next) {
    const expected = process.env.ADMIN_TOKEN;
    const provided = getToken(req);

    if (!expected) {
        console.error("ADMIN_TOKEN is not configured.");
        return res.status(500).json({
            success: false,
            message: "Admin authentication is not configured."
        });
    }

    const expectedBuffer = Buffer.from(expected);
    const providedBuffer = Buffer.from(provided);

    if (
        expectedBuffer.length !== providedBuffer.length ||
        !crypto.timingSafeEqual(expectedBuffer, providedBuffer)
    ) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized."
        });
    }

    next();
}

module.exports = adminAuth;
