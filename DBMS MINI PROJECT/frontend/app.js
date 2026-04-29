/* ══════════════════════════════════════════════════
   HABITUAL — app.js
   All logic: Auth, Habit CRUD, Streaks, UI updates
══════════════════════════════════════════════════ */

"use strict";

// ─── Helpers ────────────────────────────────────

/** Today's date as "YYYY-MM-DD" string */
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

/** Last N dates as ["YYYY-MM-DD", ...], oldest first */
function lastNDates(n) {
  const dates = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

/** Short weekday label: "Mon", "Tue", … */
function shortDay(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-US", { weekday: "short" });
}

/** Greeting based on hour */
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning ☀️";
  if (h < 17) return "Good afternoon 🌤";
  return "Good evening 🌙";
}

/** Unique ID */
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ─── Storage Keys ────────────────────────────────

const USERS_KEY   = "habitual_users";       // { username: hashedPwd }
const SESSION_KEY = "habitual_session";     // currently logged-in username
const HABITS_KEY  = (user) => `habitual_habits_${user}`;

// ─── Auth Storage ────────────────────────────────

function getUsers() {
  return JSON.parse(localStorage.getItem(USERS_KEY) || "{}");
}
function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}
function currentUser() {
  return localStorage.getItem(SESSION_KEY) || null;
}
function setSession(username) {
  localStorage.setItem(SESSION_KEY, username);
}
function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

// Very simple "hash" — not cryptographic, just for demo purposes
function simpleHash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return h.toString(16);
}

// ─── Habit Storage ───────────────────────────────

/**
 * Habit object shape:
 * {
 *   id:       string,
 *   name:     string,
 *   emoji:    string,
 *   history:  { "YYYY-MM-DD": true, ... },
 *   streak:   number,
 *   createdAt: string
 * }
 */
function getHabits(user) {
  return JSON.parse(localStorage.getItem(HABITS_KEY(user)) || "[]");
}
function saveHabits(user, habits) {
  localStorage.setItem(HABITS_KEY(user), JSON.stringify(habits));
}

/** Recalculate streak for a habit based on its history */
function calcStreak(history) {
  let streak = 0;
  const today = todayStr();
  // Walk backwards from today
  let check = new Date();
  // If today not done, streak counts from yesterday back
  if (!history[today]) {
    check.setDate(check.getDate() - 1);
  }
  while (true) {
    const ds = check.toISOString().slice(0, 10);
    if (history[ds]) {
      streak++;
      check.setDate(check.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

/** Mark a habit done for today; returns updated habit */
function markDone(habit) {
  const today = todayStr();
  habit.history[today] = true;
  habit.streak = calcStreak(habit.history);
  return habit;
}

// ─── DOM References ──────────────────────────────

const authPage      = document.getElementById("auth-page");
const dashPage      = document.getElementById("dashboard-page");

// Auth
const tabBtns       = document.querySelectorAll(".tab-btn");
const loginForm     = document.getElementById("login-form");
const registerForm  = document.getElementById("register-form");
const loginUsernameEl = document.getElementById("login-username");
const loginPasswordEl = document.getElementById("login-password");
const loginError    = document.getElementById("login-error");
const loginBtn      = document.getElementById("login-btn");
const regUsername   = document.getElementById("reg-username");
const regPassword   = document.getElementById("reg-password");
const regConfirm    = document.getElementById("reg-confirm");
const regError      = document.getElementById("reg-error");
const registerBtn   = document.getElementById("register-btn");

// Dashboard
const greetingText  = document.getElementById("greeting-text");
const todayDateEl   = document.getElementById("today-date");
const habitsGrid    = document.getElementById("habits-grid");
const emptyState    = document.getElementById("empty-state");
const completedCount = document.getElementById("completed-count");
const totalCount    = document.getElementById("total-count");
const overallBar    = document.getElementById("overall-bar");
const progressPct   = document.getElementById("progress-pct");
const sidebarUser   = document.getElementById("sidebar-user");
const logoutBtn     = document.getElementById("logout-btn");
const logoutBtnMob  = document.getElementById("logout-btn-mobile");

// Add habit
const addTriggerBtn = document.getElementById("add-trigger-btn");
const addForm       = document.getElementById("add-form");
const addConfirmBtn = document.getElementById("add-confirm-btn");
const addCancelBtn  = document.getElementById("add-cancel-btn");
const newHabitName  = document.getElementById("new-habit-name");
const addError      = document.getElementById("add-error");
const emojiBtn      = document.getElementById("emoji-btn");
const emojiDropdown = document.getElementById("emoji-dropdown");
let selectedEmoji   = "🏃";

// Delete modal
const deleteModal   = document.getElementById("delete-modal");
const modalCancel   = document.getElementById("modal-cancel");
const modalConfirm  = document.getElementById("modal-confirm");
let pendingDeleteId = null;

// ─── Page Switching ──────────────────────────────

function showPage(page) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  page.classList.add("active");
}

// ─── Auth Logic ──────────────────────────────────

// Tab switching
tabBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    tabBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const target = btn.dataset.tab;
    loginForm.classList.remove("active");
    registerForm.classList.remove("active");
    document.getElementById(`${target}-form`).classList.add("active");
    loginError.textContent = "";
    regError.textContent = "";
  });
});

// Login
loginBtn.addEventListener("click", () => {
  const username = loginUsernameEl.value.trim();
  const password = loginPasswordEl.value;

  if (!username || !password) {
    loginError.textContent = "Please fill in both fields.";
    return;
  }

  const users = getUsers();
  if (!users[username]) {
    loginError.textContent = "No account found. Please register first.";
    return;
  }
  if (users[username] !== simpleHash(password)) {
    loginError.textContent = "Incorrect password. Try again.";
    return;
  }

  setSession(username);
  loginError.textContent = "";
  loginUsernameEl.value = "";
  loginPasswordEl.value = "";
  initDashboard();
});

// Register
registerBtn.addEventListener("click", () => {
  const username = regUsername.value.trim();
  const password = regPassword.value;
  const confirm  = regConfirm.value;

  if (!username || !password || !confirm) {
    regError.textContent = "Please fill in all fields.";
    return;
  }
  if (username.length < 2) {
    regError.textContent = "Username must be at least 2 characters.";
    return;
  }
  if (password.length < 4) {
    regError.textContent = "Password must be at least 4 characters.";
    return;
  }
  if (password !== confirm) {
    regError.textContent = "Passwords do not match.";
    return;
  }

  const users = getUsers();
  if (users[username]) {
    regError.textContent = "Username already taken. Try another.";
    return;
  }

  users[username] = simpleHash(password);
  saveUsers(users);

  // Seed default habits for new user
  const defaultHabits = [
    { id: uid(), name: "Morning Run",   emoji: "🏃", history: {}, streak: 0, createdAt: todayStr() },
    { id: uid(), name: "Read 20 pages", emoji: "📚", history: {}, streak: 0, createdAt: todayStr() },
    { id: uid(), name: "Drink Water",   emoji: "💧", history: {}, streak: 0, createdAt: todayStr() },
  ];
  saveHabits(username, defaultHabits);

  setSession(username);
  regError.textContent = "";
  regUsername.value = "";
  regPassword.value = "";
  regConfirm.value = "";
  initDashboard();
});

// Logout
function logout() {
  clearSession();
  showPage(authPage);
}
logoutBtn.addEventListener("click", logout);
logoutBtnMob.addEventListener("click", logout);

// Enter key on auth inputs
[loginUsernameEl, loginPasswordEl].forEach(el =>
  el.addEventListener("keydown", e => { if (e.key === "Enter") loginBtn.click(); })
);
[regUsername, regPassword, regConfirm].forEach(el =>
  el.addEventListener("keydown", e => { if (e.key === "Enter") registerBtn.click(); })
);

// ─── Dashboard Init ──────────────────────────────

function initDashboard() {
  const user = currentUser();
  if (!user) { showPage(authPage); return; }

  // Meta
  greetingText.textContent = getGreeting();
  todayDateEl.textContent  = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric"
  });
  sidebarUser.textContent = `👤 ${user}`;

  showPage(dashPage);
  renderHabits();
}

// ─── Render Habits ───────────────────────────────

function renderHabits() {
  const user   = currentUser();
  const habits = getHabits(user);
  const today  = todayStr();
  const days   = lastNDates(7);

  habitsGrid.innerHTML = "";

  if (habits.length === 0) {
    emptyState.style.display = "block";
  } else {
    emptyState.style.display = "none";
  }

  habits.forEach((habit, idx) => {
    const isDone = !!habit.history[today];
    const card   = createHabitCard(habit, isDone, days, idx);
    habitsGrid.appendChild(card);
  });

  updateSummary(habits, today);
}

/** Build a single habit card DOM element */
function createHabitCard(habit, isDone, weekDays, idx) {
  const card = document.createElement("div");
  card.className = `habit-card ${isDone ? "done" : ""}`;
  card.dataset.id = habit.id;
  card.style.animationDelay = `${idx * 60}ms`;

  // Progress: streak / 30 days as a simple bar metric
  const barPct = Math.min(100, (habit.streak / 30) * 100).toFixed(0);

  // 7-day dots HTML
  const dotsHTML = weekDays.map(d => {
    const isToday   = d === todayStr();
    const completed = !!habit.history[d];
    return `<div class="week-dot ${completed ? "filled" : ""} ${isToday ? "today-dot" : ""}" title="${shortDay(d)}"></div>`;
  }).join("");

  card.innerHTML = `
    <div class="habit-top">
      <!-- Emoji icon -->
      <div class="habit-emoji">${habit.emoji}</div>

      <!-- Name + streak -->
      <div class="habit-info">
        <div class="habit-name">${escHtml(habit.name)}</div>
        <div class="habit-streak ${habit.streak === 0 ? "streak-zero" : ""}">
          <span class="streak-fire">🔥</span>
          <span class="streak-number">${habit.streak}</span>
          <span>${habit.streak === 1 ? "day streak" : "day streak"}</span>
        </div>
      </div>

      <!-- Buttons -->
      <div class="habit-actions">
        <button class="btn-done ${isDone ? "completed" : ""}" data-id="${habit.id}">
          ${isDone ? "✓ Done" : "Mark Done"}
        </button>
        <button class="btn-delete" data-id="${habit.id}" title="Delete habit">🗑</button>
      </div>
    </div>

    <!-- Progress bar + week dots row -->
    <div class="habit-bar-row">
      <div class="habit-bar-track">
        <div class="habit-bar-fill" style="width: ${barPct}%"></div>
      </div>
      <div class="habit-week">${dotsHTML}</div>
    </div>
  `;

  // Done button click
  card.querySelector(".btn-done").addEventListener("click", () => {
    if (isDone) return; // already done today
    handleMarkDone(habit.id);
  });

  // Delete button click
  card.querySelector(".btn-delete").addEventListener("click", () => {
    pendingDeleteId = habit.id;
    deleteModal.style.display = "flex";
  });

  return card;
}

/** Mark a habit as done and re-render */
function handleMarkDone(habitId) {
  const user   = currentUser();
  let habits   = getHabits(user);
  const idx    = habits.findIndex(h => h.id === habitId);
  if (idx === -1) return;

  habits[idx] = markDone(habits[idx]);
  saveHabits(user, habits);

  // Animate the card briefly
  const card = habitsGrid.querySelector(`[data-id="${habitId}"]`);
  if (card) {
    card.style.transform = "scale(1.03)";
    setTimeout(() => { card.style.transform = ""; }, 200);
  }

  renderHabits();
}

/** Update summary counts + overall bar */
function updateSummary(habits, today) {
  const total     = habits.length;
  const completed = habits.filter(h => !!h.history[today]).length;
  completedCount.textContent = completed;
  totalCount.textContent     = total;

  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  overallBar.style.width  = pct + "%";
  progressPct.textContent = pct + "%";
}

/** Escape HTML to prevent XSS */
function escHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ─── Add Habit ───────────────────────────────────

addTriggerBtn.addEventListener("click", () => {
  addTriggerBtn.style.display = "none";
  addForm.style.display = "block";
  newHabitName.focus();
  addError.textContent = "";
});

addCancelBtn.addEventListener("click", closeAddForm);

function closeAddForm() {
  addTriggerBtn.style.display = "flex";
  addForm.style.display = "none";
  newHabitName.value = "";
  addError.textContent = "";
  selectedEmoji = "🏃";
  emojiBtn.textContent = "🏃";
  emojiDropdown.classList.remove("open");
}

addConfirmBtn.addEventListener("click", handleAddHabit);
newHabitName.addEventListener("keydown", e => {
  if (e.key === "Enter") handleAddHabit();
  if (e.key === "Escape") closeAddForm();
});

function handleAddHabit() {
  const name = newHabitName.value.trim();
  if (!name) {
    addError.textContent = "Please give your habit a name.";
    newHabitName.focus();
    return;
  }

  const user   = currentUser();
  const habits = getHabits(user);

  // Prevent duplicate names (case-insensitive)
  if (habits.some(h => h.name.toLowerCase() === name.toLowerCase())) {
    addError.textContent = "You already have a habit with this name.";
    return;
  }

  const newHabit = {
    id:        uid(),
    name:      name,
    emoji:     selectedEmoji,
    history:   {},
    streak:    0,
    createdAt: todayStr(),
  };

  habits.push(newHabit);
  saveHabits(user, habits);
  closeAddForm();
  renderHabits();
}

// ─── Emoji Picker ────────────────────────────────

emojiBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  emojiDropdown.classList.toggle("open");
});

document.querySelectorAll(".ep-option").forEach(opt => {
  opt.addEventListener("click", () => {
    selectedEmoji = opt.dataset.emoji;
    emojiBtn.textContent = selectedEmoji;
    emojiDropdown.classList.remove("open");
  });
});

// Close emoji dropdown on outside click
document.addEventListener("click", (e) => {
  if (!e.target.closest(".emoji-picker-wrap")) {
    emojiDropdown.classList.remove("open");
  }
});

// ─── Delete Modal ────────────────────────────────

modalCancel.addEventListener("click", () => {
  deleteModal.style.display = "none";
  pendingDeleteId = null;
});

modalConfirm.addEventListener("click", () => {
  if (!pendingDeleteId) return;
  const user   = currentUser();
  let habits   = getHabits(user);
  habits       = habits.filter(h => h.id !== pendingDeleteId);
  saveHabits(user, habits);
  deleteModal.style.display = "none";
  pendingDeleteId = null;
  renderHabits();
});

// Close modal on overlay click
deleteModal.addEventListener("click", (e) => {
  if (e.target === deleteModal) {
    deleteModal.style.display = "none";
    pendingDeleteId = null;
  }
});

// ─── App Boot ────────────────────────────────────

(function init() {
  const user = currentUser();
  if (user) {
    // Already logged in — go straight to dashboard
    initDashboard();
  } else {
    showPage(authPage);
  }
})();
