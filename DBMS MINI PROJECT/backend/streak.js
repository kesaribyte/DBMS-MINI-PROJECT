// ─────────────────────────────────────────────────────────
// utils/streak.js
//
// Pure utility functions for streak calculation.
// Separated here so they can be tested independently.
// ─────────────────────────────────────────────────────────

/**
 * Calculate the current streak from an array of log rows.
 *
 * Rules:
 *  - Rows must have a `log_date` field (Date object or "YYYY-MM-DD" string).
 *  - Only rows with status = "done" are counted.
 *  - Streak = consecutive days backwards from today (inclusive).
 *  - If today is not logged, we still allow the streak to be active
 *    if yesterday was completed (user still has time today).
 *
 * @param {Array}  logs  — rows from habit_log table
 * @returns {number}       current streak count
 */
function calcStreak(logs) {
  if (!logs || logs.length === 0) return 0;

  // Build a Set of "YYYY-MM-DD" strings for fast lookup
  const doneDates = new Set(
    logs
      .filter((r) => r.status === "done")
      .map((r) => toDateStr(r.log_date))
  );

  if (doneDates.size === 0) return 0;

  const today    = toDateStr(new Date());
  let   streak   = 0;
  let   cursor   = new Date(); // start from today

  // If today isn't done yet, start checking from yesterday
  // so we don't break an active streak mid-day
  if (!doneDates.has(today)) {
    cursor.setDate(cursor.getDate() - 1);
  }

  // Walk backwards day by day until a gap is found
  while (doneDates.has(toDateStr(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

/**
 * Calculate the longest streak ever achieved.
 *
 * @param {Array}  logs  — rows from habit_log table
 * @returns {number}       longest streak count
 */
function calcBestStreak(logs) {
  if (!logs || logs.length === 0) return 0;

  // Collect all done dates, sort ascending
  const dates = logs
    .filter((r) => r.status === "done")
    .map((r) => toDateStr(r.log_date))
    .sort();

  if (dates.length === 0) return 0;

  let best    = 1;
  let current = 1;

  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diff = (curr - prev) / (1000 * 60 * 60 * 24); // difference in days

    if (diff === 1) {
      // Consecutive day
      current++;
      if (current > best) best = current;
    } else if (diff > 1) {
      // Gap — reset
      current = 1;
    }
    // diff === 0 means duplicate date (shouldn't happen with UNIQUE key)
  }

  return best;
}

/**
 * Convert a Date object or date string to "YYYY-MM-DD".
 * MySQL DATE columns come back as Date objects; this normalises both.
 */
function toDateStr(date) {
  if (date instanceof Date) {
    // Use UTC values to avoid timezone-shift issues
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, "0");
    const d = String(date.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  // Already a string — ensure it's just the date part
  return String(date).slice(0, 10);
}

module.exports = { calcStreak, calcBestStreak, toDateStr };
