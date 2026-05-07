// ═══════════════════════════════════════════════════════════
//  server.js  —  Habit Tracker API Entry Point
// ═══════════════════════════════════════════════════════════

"use strict";

const express = require("express");
const cors = require("cors");
require("dotenv").config();

// ── Import route modules ─────────────────────────────────
const userRoutes = require("./userRoutes");
const habitRoutes = require("./habitRoutes");
const logRoutes = require("./logRoutes");

// ── Import error handler ─────────────────────────────────
const { errorHandler } = require("./middleware/errorHandler");

// ── Create Express app ───────────────────────────────────
const app = express();
const PORT = process.env.PORT || 3000;

// ════════════════════════════════════════════════════════
// MIDDLEWARE
// ════════════════════════════════════════════════════════

// Enable CORS
app.use(cors());

// Parse JSON
app.use(express.json());

// Parse form data
app.use(express.urlencoded({ extended: true }));

// Request Logger
app.use((req, res, next) => {
  const time = new Date().toLocaleString();
  console.log(`[${time}] ${req.method} ${req.url}`);
  next();
});

// ════════════════════════════════════════════════════════
// ROUTES
// ════════════════════════════════════════════════════════

// Home Route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🌿 Habit Tracker API Running Successfully",
  });
});

// API Routes
app.use("/", userRoutes);
app.use("/", habitRoutes);
app.use("/", logRoutes);

// ════════════════════════════════════════════════════════
// 404 Route
// ════════════════════════════════════════════════════════

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// ════════════════════════════════════════════════════════
// Error Handler
// ════════════════════════════════════════════════════════

app.use(errorHandler);

// ════════════════════════════════════════════════════════
// START SERVER
// ════════════════════════════════════════════════════════

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

module.exports = app;