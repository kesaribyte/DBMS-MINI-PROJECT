// ─────────────────────────────────────────────────────────
// routes/habitRoutes.js
// ─────────────────────────────────────────────────────────

const express = require("express");
const router  = express.Router();
const { addHabit, getHabitsByUser, deleteHabit } = require("./habitController");

// POST   /habits             — create a habit
router.post("/habits", addHabit);

// GET    /habits/:user_id    — get all habits for a user (with streaks)
router.get("/habits/:user_id", getHabitsByUser);

// DELETE /habits/:id         — delete a habit
router.delete("/habits/:id", deleteHabit);

module.exports = router;
