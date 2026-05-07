// ─────────────────────────────────────────────────────────
// config/db.js  —  MySQL connection pool
//
// Uses mysql2 with a connection pool (recommended for APIs
// so connections are reused rather than opened per request).
// ─────────────────────────────────────────────────────────

const mysql = require("mysql2/promise");
require("dotenv").config();

// Create a connection pool
const pool = mysql.createPool({
  host:               process.env.DB_HOST     || "localhost",
  port:               process.env.DB_PORT     || 3306,
  user:               process.env.DB_USER     || "root",
  password:           process.env.DB_PASSWORD || "",
  database:           process.env.DB_NAME     || "habit_tracker",
  waitForConnections: true,   // queue queries when all connections are busy
  connectionLimit:    10,     // max simultaneous connections
  queueLimit:         0,      // unlimited queued requests
  timezone:           "+00:00", // store/retrieve dates in UTC
});

// Test connection on startup and log result
pool.getConnection()
  .then((conn) => {
    console.log("✅  MySQL connected successfully");
    conn.release(); // return connection to pool immediately
  })
  .catch((err) => {
    console.error("❌  MySQL connection failed:", err.message);
    console.error("    Make sure MySQL is running and .env credentials are correct.");
    process.exit(1); // stop server if DB is unreachable
  });

module.exports = pool;
