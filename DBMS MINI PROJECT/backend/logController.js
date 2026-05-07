// ─────────────────────────────────────────────────────────
// controllers/logController.js
//
// Business logic for Habit Log endpoints.
// ─────────────────────────────────────────────────────────

const db = require("./config/db");
const { createError } = require("./middleware/errorHandler");
const { calcStreak, calcBestStreak, toDateStr } = require("./utils/streak");
/**
 * POST /log
 * Body: { habit_id, date? }
 * Marks a habit as "done" for a given date (defaults to today).
 * Uses INSERT ... ON DUPLICATE KEY UPDATE so re-calling is idempotent.
 */
async function markHabitDone(req, res, next) {
  try {
    const { habit_id, date } = req.body;

    // ── Validation ────────────────────────────────────
    if (!habit_id) {
      throw createError(400, "'habit_id' is required.");
    }

    // Resolve the date — default to today (UTC)
    const logDate = date ? String(date).slice(0, 10) : toDateStr(new Date());

    // Validate date format YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(logDate)) {
      throw createError(400, "Date must be in YYYY-MM-DD format.");
    }

    // Prevent logging future dates
    const today = toDateStr(new Date());
    if (logDate > today) {
      throw createError(400, "Cannot log a habit for a future date.");
    }

    // Verify habit exists
    const [habits] = await db.execute(
      "SELECT habit_id, habit_name FROM habits WHERE habit_id = ?",
      [habit_id]
    );
    if (habits.length === 0) {
      throw createError(404, `Habit with ID ${habit_id} not found.`);
    }

    // ── Upsert Log Entry ──────────────────────────────
    // If an entry already exists for this (habit_id, date), update it to "done".
    await db.execute(
      `INSERT INTO habit_log (habit_id, log_date, status)
       VALUES (?, ?, 'done')
       ON DUPLICATE KEY UPDATE status = 'done'`,
      [habit_id, logDate]
    );

    // Recalculate streak after logging
    const [logs] = await db.execute(
      "SELECT log_date, status FROM habit_log WHERE habit_id = ? ORDER BY log_date DESC",
      [habit_id]
    );
    const streak = calcStreak(logs);

    res.status(201).json({
      success: true,
      message: `"${habits[0].habit_name}" marked as done for ${logDate}.`,
      data: {
        habit_id:   Number(habit_id),
        habit_name: habits[0].habit_name,
        log_date:   logDate,
        status:     "done",
        streak,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /log/:habit_id
 * Returns the full log history for a habit plus streak stats.
 * Optional query param: ?days=30  (default: all history)
 */
async function getHabitLog(req, res, next) {
  try {
    const { habit_id } = req.params;
    const days = parseInt(req.query.days, 10) || null;

    // Verify habit exists
    const [habits] = await db.execute(
      "SELECT h.habit_id, h.habit_name, h.emoji, u.name AS user_name FROM habits h JOIN users u ON h.user_id = u.user_id WHERE h.habit_id = ?",
      [habit_id]
    );
    if (habits.length === 0) {
      throw createError(404, `Habit with ID ${habit_id} not found.`);
    }

    // Fetch logs — optionally filter to last N days
    let logQuery = "SELECT log_id, log_date, status, created_at FROM habit_log WHERE habit_id = ?";
    const params = [habit_id];

    if (days) {
      logQuery += " AND log_date >= CURDATE() - INTERVAL ? DAY";
      params.push(days);
    }

    logQuery += " ORDER BY log_date DESC";
    const [logs] = await db.execute(logQuery, params);

    // Normalise log_date to strings for consistent JSON output
    const normalisedLogs = logs.map((l) => ({
      ...l,
      log_date: toDateStr(l.log_date),
    }));

    // Streak calculations use ALL history (not just filtered window)
    const [allLogs] = await db.execute(
      "SELECT log_date, status FROM habit_log WHERE habit_id = ? ORDER BY log_date DESC",
      [habit_id]
    );
    const streak     = calcStreak(allLogs);
    const bestStreak = calcBestStreak(allLogs);
    const totalDone  = allLogs.filter((l) => l.status === "done").length;

    res.json({
      success:     true,
      habit:       habits[0],
      stats: {
        streak,
        best_streak: bestStreak,
        total_done:  totalDone,
        log_count:   normalisedLogs.length,
      },
      data: normalisedLogs,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /log/:habit_id/week
 * Returns the last 7 days status for a habit (for the weekly view on the frontend).
 */
async function getHabitWeek(req, res, next) {
  try {
    const { habit_id } = req.params;

    // Verify habit
    const [habits] = await db.execute(
      "SELECT habit_id FROM habits WHERE habit_id = ?",
      [habit_id]
    );
    if (habits.length === 0) {
      throw createError(404, `Habit with ID ${habit_id} not found.`);
    }

    // Build the last 7 days as date strings
    const week = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      week.push(toDateStr(d));
    }

    // Fetch logs for those specific dates
    const [logs] = await db.execute(
      `SELECT log_date, status
       FROM habit_log
       WHERE habit_id = ? AND log_date >= CURDATE() - INTERVAL 6 DAY
       ORDER BY log_date ASC`,
      [habit_id]
    );

    // Map each day to done/not done
    const logMap = {};
    logs.forEach((l) => {
      logMap[toDateStr(l.log_date)] = l.status;
    });

    const weekData = week.map((date) => ({
      date,
      status: logMap[date] || "not_logged",
      done:   logMap[date] === "done",
    }));

    res.json({ success: true, habit_id: Number(habit_id), data: weekData });
  } catch (err) {
    next(err);
  }
}

module.exports = { markHabitDone, getHabitLog, getHabitWeek };
