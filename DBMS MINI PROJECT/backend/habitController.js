// ─────────────────────────────────────────────────────────
// controllers/habitController.js
//
// Business logic for Habit endpoints.
// ─────────────────────────────────────────────────────────

const db = require("../config/db");
const { createError } = require("../middleware/errorHandler");
const { calcStreak, calcBestStreak } = require("../utils/streak");

/**
 * POST /habits
 * Body: { user_id, habit_name, emoji? }
 * Creates a new habit for a user.
 */
async function addHabit(req, res, next) {
  try {
    const { user_id, habit_name, emoji = "🏃" } = req.body;

    // ── Validation ────────────────────────────────────
    if (!user_id || !habit_name) {
      throw createError(400, "'user_id' and 'habit_name' are required.");
    }
    if (habit_name.trim().length < 2) {
      throw createError(400, "Habit name must be at least 2 characters.");
    }

    // Check the user exists
    const [users] = await db.execute(
      "SELECT user_id FROM users WHERE user_id = ?",
      [user_id]
    );
    if (users.length === 0) {
      throw createError(404, `User with ID ${user_id} not found.`);
    }

    // ── Insert ────────────────────────────────────────
    const [result] = await db.execute(
      "INSERT INTO habits (user_id, habit_name, emoji) VALUES (?, ?, ?)",
      [user_id, habit_name.trim(), emoji]
    );

    res.status(201).json({
      success: true,
      message: "Habit created successfully.",
      data: {
        habit_id:   result.insertId,
        user_id:    Number(user_id),
        habit_name: habit_name.trim(),
        emoji,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /habits/:user_id
 * Returns all habits for a user, each with current streak info.
 */
async function getHabitsByUser(req, res, next) {
  try {
    const { user_id } = req.params;

    // Verify user exists
    const [users] = await db.execute(
      "SELECT user_id, name FROM users WHERE user_id = ?",
      [user_id]
    );
    if (users.length === 0) {
      throw createError(404, `User with ID ${user_id} not found.`);
    }

    // Fetch all habits for the user
    const [habits] = await db.execute(
      "SELECT habit_id, habit_name, emoji, created_at FROM habits WHERE user_id = ? ORDER BY created_at ASC",
      [user_id]
    );

    // For each habit, load its log and compute streak
    const habitsWithStreak = await Promise.all(
      habits.map(async (habit) => {
        const [logs] = await db.execute(
          "SELECT log_date, status FROM habit_log WHERE habit_id = ? ORDER BY log_date DESC",
          [habit.habit_id]
        );

        const streak     = calcStreak(logs);
        const bestStreak = calcBestStreak(logs);
        const today      = new Date().toISOString().slice(0, 10);
        const doneToday  = logs.some(
          (l) => l.log_date?.toISOString?.().slice(0, 10) === today ||
                 String(l.log_date).slice(0, 10) === today
        );

        return {
          ...habit,
          streak,
          best_streak: bestStreak,
          done_today:  doneToday,
          total_days:  logs.filter((l) => l.status === "done").length,
        };
      })
    );

    res.json({
      success: true,
      user:    users[0],
      count:   habitsWithStreak.length,
      data:    habitsWithStreak,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /habits/:id
 * Deletes a habit and all its logs (CASCADE handles logs).
 */
async function deleteHabit(req, res, next) {
  try {
    const { id } = req.params;

    // Check it exists before deleting
    const [rows] = await db.execute(
      "SELECT habit_id, habit_name FROM habits WHERE habit_id = ?",
      [id]
    );
    if (rows.length === 0) {
      throw createError(404, `Habit with ID ${id} not found.`);
    }

    await db.execute("DELETE FROM habits WHERE habit_id = ?", [id]);

    res.json({
      success: true,
      message: `Habit "${rows[0].habit_name}" deleted successfully.`,
      deleted_id: Number(id),
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { addHabit, getHabitsByUser, deleteHabit };
