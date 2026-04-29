// ═══════════════════════════════════════════════════════════
//  frontend-integration.js
//
//  Drop this into your existing frontend (or use as reference)
//  to replace localStorage with real API calls.
//
//  Add <script src="frontend-integration.js"></script>
//  BEFORE your app.js in index.html.
// ═══════════════════════════════════════════════════════════

"use strict";

// ── Base URL of your running backend ────────────────────
const API_BASE = "http://localhost:3000";

// ────────────────────────────────────────────────────────
//  Helper: generic fetch wrapper with error handling
// ────────────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json();

  if (!res.ok) {
    // Throw so the caller can catch and display the error message
    throw new Error(data.error || `Request failed (${res.status})`);
  }

  return data;
}

// ════════════════════════════════════════════════════════
//  USER APIs
// ════════════════════════════════════════════════════════

/**
 * Register a new user.
 * @returns { user_id, name, email }
 */
async function apiRegister(name, email) {
  const res = await apiFetch("/register", {
    method: "POST",
    body:   { name, email },
  });
  return res.data; // { user_id, name, email }
}

/**
 * Fetch all users.
 * @returns Array of user objects
 */
async function apiGetAllUsers() {
  const res = await apiFetch("/users");
  return res.data;
}

/**
 * Fetch a single user by ID.
 */
async function apiGetUser(userId) {
  const res = await apiFetch(`/users/${userId}`);
  return res.data;
}

// ════════════════════════════════════════════════════════
//  HABIT APIs
// ════════════════════════════════════════════════════════

/**
 * Add a new habit.
 * @returns { habit_id, user_id, habit_name, emoji }
 */
async function apiAddHabit(userId, habitName, emoji = "🏃") {
  const res = await apiFetch("/habits", {
    method: "POST",
    body:   { user_id: userId, habit_name: habitName, emoji },
  });
  return res.data;
}

/**
 * Get all habits for a user (with streak info).
 * @returns Array of habit objects, each with .streak, .done_today, .best_streak
 */
async function apiGetHabits(userId) {
  const res = await apiFetch(`/habits/${userId}`);
  return res.data;
}

/**
 * Delete a habit by ID.
 */
async function apiDeleteHabit(habitId) {
  const res = await apiFetch(`/habits/${habitId}`, { method: "DELETE" });
  return res;
}

// ════════════════════════════════════════════════════════
//  LOG APIs
// ════════════════════════════════════════════════════════

/**
 * Mark a habit as done for today (or a specific date).
 * @returns { habit_id, log_date, status, streak }
 */
async function apiMarkDone(habitId, date = null) {
  const body = { habit_id: habitId };
  if (date) body.date = date;

  const res = await apiFetch("/log", { method: "POST", body });
  return res.data;
}

/**
 * Get full log history + streak stats for a habit.
 * @param {number} days  Optional: limit to last N days
 */
async function apiGetLog(habitId, days = null) {
  const query = days ? `?days=${days}` : "";
  const res   = await apiFetch(`/log/${habitId}${query}`);
  return res; // { habit, stats, data: [...] }
}

/**
 * Get last-7-days status for a habit (for calendar dots).
 * @returns Array of { date, status, done } for each of the last 7 days
 */
async function apiGetWeek(habitId) {
  const res = await apiFetch(`/log/${habitId}/week`);
  return res.data;
}

// ════════════════════════════════════════════════════════
//  EXAMPLE: How to replace localStorage calls in app.js
// ════════════════════════════════════════════════════════

/*
  ── REGISTRATION ─────────────────────────────────────────

  OLD (localStorage):
    const users = getUsers();
    users[username] = simpleHash(password);
    saveUsers(users);

  NEW (API):
    try {
      const user = await apiRegister(username, email);
      setSession(user.user_id);   // store user_id instead of username
      initDashboard();
    } catch (err) {
      regError.textContent = err.message;
    }


  ── LOAD HABITS ──────────────────────────────────────────

  OLD:
    const habits = getHabits(currentUser());

  NEW:
    const habits = await apiGetHabits(currentUser());
    // habits[i].streak, habits[i].done_today are already computed by backend


  ── MARK DONE ────────────────────────────────────────────

  OLD:
    habits[idx] = markDone(habits[idx]);
    saveHabits(user, habits);

  NEW:
    try {
      const result = await apiMarkDone(habitId);
      console.log("New streak:", result.streak);
      renderHabits();   // re-fetch + re-render
    } catch (err) {
      alert(err.message);
    }


  ── ADD HABIT ────────────────────────────────────────────

  OLD:
    habits.push(newHabit);
    saveHabits(user, habits);

  NEW:
    try {
      await apiAddHabit(currentUser(), habitName, selectedEmoji);
      closeAddForm();
      renderHabits();
    } catch (err) {
      addError.textContent = err.message;
    }


  ── DELETE HABIT ─────────────────────────────────────────

  OLD:
    habits = habits.filter(h => h.id !== pendingDeleteId);
    saveHabits(user, habits);

  NEW:
    try {
      await apiDeleteHabit(pendingDeleteId);
      renderHabits();
    } catch (err) {
      alert(err.message);
    }
*/

// Export for use in app.js (if using ES modules or bundler)
// If using plain <script> tags, these functions are global.
if (typeof module !== "undefined") {
  module.exports = {
    apiRegister, apiGetAllUsers, apiGetUser,
    apiAddHabit, apiGetHabits, apiDeleteHabit,
    apiMarkDone, apiGetLog, apiGetWeek,
  };
}
