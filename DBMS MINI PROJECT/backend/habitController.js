// ─────────────────────────────────────────────────────────
// habitController.js
//
// Keeps OLD UI working with NEW database structure
// ─────────────────────────────────────────────────────────

const db = require("./config/db");

// ─────────────────────────────────────────────────────────
// ADD HABIT
// POST /habits
// ─────────────────────────────────────────────────────────

async function addHabit(req, res) {

  try {

    const { user_id, title } = req.body;

    // Validation
    if (!user_id || !title) {

      return res.status(400).json({
        success: false,
        error: "user_id and title are required"
      });

    }

    // Insert habit
    const [result] = await db.execute(
      "INSERT INTO habits (user_id, title) VALUES (?, ?)",
      [user_id, title]
    );

    // Return OLD UI format
    res.status(201).json({

      success: true,

      message: "Habit created successfully",

      data: {

        habit_id: result.insertId,
        user_id: Number(user_id),

        habit_name: title,

        emoji: "🌿",

        streak: 0,
        best_streak: 0,
        done_today: false

      }

    });

  } catch (err) {

    console.error(err);

    res.status(500).json({

      success: false,
      error: err.message

    });

  }

}

// ─────────────────────────────────────────────────────────
// GET HABITS
// GET /habits/:user_id
// ─────────────────────────────────────────────────────────

async function getHabitsByUser(req, res) {

  try {

    const { user_id } = req.params;

    // Get habits
    const [rows] = await db.execute(

      "SELECT * FROM habits WHERE user_id = ? ORDER BY created_at DESC",

      [user_id]

    );

    // Convert DB columns → OLD UI structure
    const habits = rows.map(habit => ({

      habit_id: habit.id,

      user_id: habit.user_id,

      habit_name: habit.title,

      emoji: "🌿",

      streak: 0,

      best_streak: 0,

      done_today: false,

      created_at: habit.created_at

    }));

    res.json({

      success: true,

      count: habits.length,

      data: habits

    });

  } catch (err) {

    console.error(err);

    res.status(500).json({

      success: false,

      error: err.message

    });

  }

}

// ─────────────────────────────────────────────────────────
// DELETE HABIT
// DELETE /habits/:id
// ─────────────────────────────────────────────────────────

async function deleteHabit(req, res) {

  try {

    const { id } = req.params;

    // Delete habit
    await db.execute(

      "DELETE FROM habits WHERE id = ?",

      [id]

    );

    res.json({

      success: true,

      message: "Habit deleted successfully"

    });

  } catch (err) {

    console.error(err);

    res.status(500).json({

      success: false,

      error: err.message

    });

  }

}

// ─────────────────────────────────────────────────────────

module.exports = {

  addHabit,

  getHabitsByUser,

  deleteHabit

};