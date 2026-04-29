// ─────────────────────────────────────────────────────────
// routes/logRoutes.js
// ─────────────────────────────────────────────────────────

const express = require("express");
const router  = express.Router();
const { markHabitDone, getHabitLog, getHabitWeek } = require("../controllers/logController");

// POST /log                    — mark a habit as done
router.post("/log", markHabitDone);

// GET  /log/:habit_id          — get full log history + stats
//      optional: ?days=30      — filter to last N days
router.get("/log/:habit_id", getHabitLog);

// GET  /log/:habit_id/week     — get last 7 days status (for calendar dots)
router.get("/log/:habit_id/week", getHabitWeek);

module.exports = router;
