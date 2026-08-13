const { Pool } = require("pg");

const pool = new Pool({
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || "hensil",
    user: process.env.DB_USER || "u0_a679",
    password: process.env.DB_PASSWORD || ""
});

module.exports = pool;
