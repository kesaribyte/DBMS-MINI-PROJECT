// ─────────────────────────────────────────────────────────
// controllers/userController.js
//
// Business logic for User endpoints.
// Each function: validates input → queries DB → returns JSON.
// ─────────────────────────────────────────────────────────

const db = require("../config/db");
const { createError } = require("../middleware/errorHandler");

/**
 * POST /register
 * Body: { name, email }
 * Creates a new user. Email must be unique.
 */
async function registerUser(req, res, next) {
  try {
    const { name, email } = req.body;

    // ── Validation ────────────────────────────────────
    if (!name || !email) {
      throw createError(400, "Both 'name' and 'email' are required.");
    }
    if (typeof name !== "string" || name.trim().length < 2) {
      throw createError(400, "Name must be at least 2 characters.");
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw createError(400, "Please provide a valid email address.");
    }

    // ── Insert ────────────────────────────────────────
    const [result] = await db.execute(
      "INSERT INTO users (name, email) VALUES (?, ?)",
      [name.trim(), email.trim().toLowerCase()]
    );

    res.status(201).json({
      success: true,
      message: "User registered successfully.",
      data: {
        user_id: result.insertId,
        name:    name.trim(),
        email:   email.trim().toLowerCase(),
      },
    });
  } catch (err) {
    // MySQL duplicate entry error code
    if (err.code === "ER_DUP_ENTRY") {
      return next(createError(409, "An account with this email already exists."));
    }
    next(err);
  }
}

/**
 * GET /users
 * Returns all users (without sensitive fields).
 */
async function getAllUsers(req, res, next) {
  try {
    const [rows] = await db.execute(
      "SELECT user_id, name, email, created_at FROM users ORDER BY created_at DESC"
    );

    res.json({
      success: true,
      count:   rows.length,
      data:    rows,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /users/:user_id
 * Returns a single user by ID.
 */
async function getUserById(req, res, next) {
  try {
    const { user_id } = req.params;

    const [rows] = await db.execute(
      "SELECT user_id, name, email, created_at FROM users WHERE user_id = ?",
      [user_id]
    );

    if (rows.length === 0) {
      throw createError(404, `User with ID ${user_id} not found.`);
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
}

module.exports = { registerUser, getAllUsers, getUserById };
