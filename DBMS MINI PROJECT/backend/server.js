// ═══════════════════════════════════════════════════════════
//  server.js  —  Habit Tracker API Entry Point
//
//  Start dev server:  npm run dev
//  Start prod server: npm start
// ═══════════════════════════════════════════════════════════

"use strict";

const express = require("express");
const cors    = require("cors");
require("dotenv").config();

// ── Import route modules ─────────────────────────────────
const userRoutes  = require("./routes/userRoutes");
const habitRoutes = require("./routes/habitRoutes");
const logRoutes   = require("./routes/logRoutes");

// ── Import error handler ─────────────────────────────────
const { errorHandler } = require("./middleware/errorHandler");

// ── Create Express app ───────────────────────────────────
const app  = express();
const PORT = process.env.PORT || 3000;

// ════════════════════════════════════════════════════════
//  MIDDLEWARE
// ════════════════════════════════════════════════════════

// CORS — allow requests from your frontend origin
app.use(cors({
  origin: [
    "http://localhost:5500",   // VS Code Live Server (default)
    "http://127.0.0.1:5500",
    "http://localhost:3001",   // if you run a dev server on 3001
    // Add your production frontend URL here, e.g.:
    // "https://my-habit-app.vercel.app"
  ],
  methods:     ["GET", "POST", "DELETE", "PATCH", "OPTIONS"],
  credentials: true,
}));

// Parse incoming JSON bodies
app.use(express.json());

// Parse URL-encoded form bodies (optional but useful)
app.use(express.urlencoded({ extended: true }));

// Simple request logger (dev-friendly)
app.use((req, _res, next) => {
  const ts = new Date().toISOString().replace("T", " ").slice(0, 19);
  console.log(`[${ts}]  ${req.method.padEnd(6)} ${req.path}`);
  next();
});

// ════════════════════════════════════════════════════════
//  ROUTES
// ════════════════════════════════════════════════════════

// Health check — useful for deployment platforms
app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "🌿 Habit Tracker API is running",
    version: "1.0.0",
    endpoints: {
      users:  ["POST /register", "GET /users", "GET /users/:user_id"],
      habits: ["POST /habits", "GET /habits/:user_id", "DELETE /habits/:id"],
      logs:   ["POST /log", "GET /log/:habit_id", "GET /log/:habit_id/week"],
    },
  });
});

// Mount route groups
app.use("/", userRoutes);   // /register, /users
app.use("/", habitRoutes);  // /habits
app.use("/", logRoutes);    // /log

// ── 404 handler — must be AFTER all routes ───────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error:   "Endpoint not found. Check the API docs at GET /",
  });
});

// ── Global error handler — must be LAST ─────────────────
app.use(errorHandler);

// ════════════════════════════════════════════════════════
//  START SERVER
// ════════════════════════════════════════════════════════
app.listen(PORT, () => {
  console.log(`\n🌿  Habit Tracker API`);
  console.log(`    Listening on   http://localhost:${PORT}`);
  console.log(`    Environment:   ${process.env.NODE_ENV || "development"}\n`);
});

module.exports = app; // exported for testing
