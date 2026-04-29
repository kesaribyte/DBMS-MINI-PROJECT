// ─────────────────────────────────────────────────────────
// routes/userRoutes.js
// ─────────────────────────────────────────────────────────

const express = require("express");
const router  = express.Router();
const { registerUser, getAllUsers, getUserById } = require("../controllers/userController");

// POST /register  — create a new user
router.post("/register", registerUser);

// GET  /users     — list all users
router.get("/users", getAllUsers);

// GET  /users/:user_id  — get a single user
router.get("/users/:user_id", getUserById);

module.exports = router;
