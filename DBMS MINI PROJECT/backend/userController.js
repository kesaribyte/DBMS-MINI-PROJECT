// ─────────────────────────────────────────────────────────
// userController.js
// ─────────────────────────────────────────────────────────

const db = require("./config/db");
const { createError } = require("./middleware/errorHandler");

/**
 * POST /register
 * Body: { name, email, password }
 */
async function registerUser(req, res, next) {
  try {

    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      throw createError(
        400,
        "Name, email and password are required."
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      throw createError(400, "Please enter valid email.");
    }

    // Insert user
    const [result] = await db.execute(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      [
        name.trim(),
        email.trim().toLowerCase(),
        password
      ]
    );

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user_id: result.insertId,
        name,
        email,
      },
    });

  } catch (err) {

    if (err.code === "ER_DUP_ENTRY") {
      return next(
        createError(409, "Email already exists.")
      );
    }

    next(err);
  }
}

/**
 * POST /login
 * Body: { email, password }
 */
async function loginUser(req, res, next) {
  try {

    const { email, password } = req.body;

    if (!email || !password) {
      throw createError(
        400,
        "Email and password required."
      );
    }

    const [rows] = await db.execute(
      "SELECT * FROM users WHERE email = ? AND password = ?",
      [email, password]
    );

    if (rows.length === 0) {
      throw createError(
        401,
        "Invalid email or password"
      );
    }

    res.json({
      success: true,
      message: "Login successful",
      user: rows[0],
    });

  } catch (err) {
    next(err);
  }
}

/**
 * GET /users
 */
async function getAllUsers(req, res, next) {
  try {

    const [rows] = await db.execute(
      "SELECT user_id, name, email, created_at FROM users ORDER BY created_at DESC"
    );

    res.json({
      success: true,
      count: rows.length,
      data: rows,
    });

  } catch (err) {
    next(err);
  }
}

/**
 * GET /users/:user_id
 */
async function getUserById(req, res, next) {
  try {

    const { user_id } = req.params;

    const [rows] = await db.execute(
      "SELECT user_id, name, email, created_at FROM users WHERE user_id = ?",
      [user_id]
    );

    if (rows.length === 0) {
      throw createError(
        404,
        `User with ID ${user_id} not found.`
      );
    }

    res.json({
      success: true,
      data: rows[0],
    });

  } catch (err) {
    next(err);
  }
}

module.exports = {
  registerUser,
  loginUser,
  getAllUsers,
  getUserById,
};