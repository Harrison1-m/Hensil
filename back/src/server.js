// Production entry point (run by pm2 as "hensil").
// The Express app lives in ./app.js so tests can mount it without binding a port.
const app = require("./app");

const PORT = process.env.PORT || 5000;

// Bound to localhost only: nginx terminates HTTPS and proxies /api here.
app.listen(PORT, '127.0.0.1', () => {
    console.log(`Hensil backend running on port ${PORT}`);
});
