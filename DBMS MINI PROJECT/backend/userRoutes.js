// ─────────────────────────────────────────────────────────
// routes/userRoutes.js
// ─────────────────────────────────────────────────────────

const express = require("express");
const router = express.Router();

const {
  registerUser,
  loginUser,
  getAllUsers,
  getUserById
} = require("./userController");

// Register user
router.post("/register", registerUser);

// Login user
router.post("/login", loginUser);

// Get all users
router.get("/users", getAllUsers);

// Get single user
router.get("/users/:user_id", getUserById);

module.exports = router;