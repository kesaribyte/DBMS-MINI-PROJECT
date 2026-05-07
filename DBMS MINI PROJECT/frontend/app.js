/* ══════════════════════════════════════════════════
   HABITUAL — Backend Connected app.js
   FINAL WORKING VERSION
══════════════════════════════════════════════════ */

"use strict";

// ────────────────────────────────────────────────
// API
// ────────────────────────────────────────────────

const API_URL = "http://localhost:3000";

// ────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────

function getGreeting() {

  const h = new Date().getHours();

  if (h < 12) return "Good morning ☀️";

  if (h < 17) return "Good afternoon 🌤";

  return "Good evening 🌙";
}

function escHtml(str) {

  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

}

// ────────────────────────────────────────────────
// SESSION
// ────────────────────────────────────────────────

function setSession(user) {

  localStorage.setItem(
    "habitual_user",
    JSON.stringify(user)
  );

}

function currentUser() {

  return JSON.parse(
    localStorage.getItem(
      "habitual_user"
    )
  );

}

function clearSession() {

  localStorage.removeItem(
    "habitual_user"
  );

}

// ────────────────────────────────────────────────
// DOM
// ────────────────────────────────────────────────

const authPage =
  document.getElementById("auth-page");

const dashPage =
  document.getElementById("dashboard-page");

const tabBtns =
  document.querySelectorAll(".tab-btn");

const loginForm =
  document.getElementById("login-form");

const registerForm =
  document.getElementById("register-form");

const loginBtn =
  document.getElementById("login-btn");

const registerBtn =
  document.getElementById("register-btn");

const loginUsername =
  document.getElementById("login-username");

const loginPassword =
  document.getElementById("login-password");

const regUsername =
  document.getElementById("reg-username");

const regPassword =
  document.getElementById("reg-password");

const regConfirm =
  document.getElementById("reg-confirm");

const loginError =
  document.getElementById("login-error");

const regError =
  document.getElementById("reg-error");

const greetingText =
  document.getElementById("greeting-text");

const todayDate =
  document.getElementById("today-date");

const habitsGrid =
  document.getElementById("habits-grid");

const emptyState =
  document.getElementById("empty-state");

const completedCount =
  document.getElementById("completed-count");

const totalCount =
  document.getElementById("total-count");

const overallBar =
  document.getElementById("overall-bar");

const progressPct =
  document.getElementById("progress-pct");

const sidebarUser =
  document.getElementById("sidebar-user");

const logoutBtn =
  document.getElementById("logout-btn");

const logoutBtnMobile =
  document.getElementById("logout-btn-mobile");

// ADD HABIT
const addTriggerBtn =
  document.getElementById("add-trigger-btn");

const addForm =
  document.getElementById("add-form");

const addConfirmBtn =
  document.getElementById("add-confirm-btn");

const addCancelBtn =
  document.getElementById("add-cancel-btn");

const newHabitName =
  document.getElementById("new-habit-name");

const addError =
  document.getElementById("add-error");

// DELETE MODAL
const deleteModal =
  document.getElementById("delete-modal");

const modalCancel =
  document.getElementById("modal-cancel");

const modalConfirm =
  document.getElementById("modal-confirm");

let pendingDeleteId = null;

// ────────────────────────────────────────────────
// PAGE SWITCH
// ────────────────────────────────────────────────

function showPage(page) {

  document
    .querySelectorAll(".page")
    .forEach(p =>
      p.classList.remove("active")
    );

  page.classList.add("active");

}

// ────────────────────────────────────────────────
// TABS
// ────────────────────────────────────────────────

tabBtns.forEach(btn => {

  btn.addEventListener("click", () => {

    tabBtns.forEach(b =>
      b.classList.remove("active")
    );

    btn.classList.add("active");

    const target =
      btn.dataset.tab;

    loginForm.classList.remove(
      "active"
    );

    registerForm.classList.remove(
      "active"
    );

    document
      .getElementById(
        `${target}-form`
      )
      .classList.add("active");

  });

});

// ────────────────────────────────────────────────
// REGISTER
// ────────────────────────────────────────────────

registerBtn.addEventListener(
  "click",
  async () => {

    const username =
      regUsername.value.trim();

    const password =
      regPassword.value;

    const confirm =
      regConfirm.value;

    regError.textContent = "";

    if (
      !username ||
      !password ||
      !confirm
    ) {

      regError.textContent =
        "Please fill all fields";

      return;
    }

    if (password !== confirm) {

      regError.textContent =
        "Passwords do not match";

      return;
    }

    try {

      const response =
        await fetch(
          `${API_URL}/register`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({

              name: username,

              email:
                `${username}@gmail.com`,

              password: password

            })

          }
        );

      const data =
        await response.json();

      if (!data.success) {

        regError.textContent =
          data.error || "Failed";

        return;
      }

      setSession(data.data);

      initDashboard();

    } catch (err) {

      console.error(err);

      regError.textContent =
        "Server error";

    }

  }
);

// ────────────────────────────────────────────────
// LOGIN
// ────────────────────────────────────────────────

loginBtn.addEventListener(
  "click",
  async () => {

    const username =
      loginUsername.value.trim();

    if (!username) {

      loginError.textContent =
        "Enter username";

      return;
    }

    try {

      const response =
        await fetch(
          `${API_URL}/users`
        );

      const data =
        await response.json();

      const user =
        data.data.find(
          u =>
            u.name === username
        );

      if (!user) {

        loginError.textContent =
          "User not found";

        return;
      }

      setSession(user);

      initDashboard();

    } catch (err) {

      console.error(err);

      loginError.textContent =
        "Server error";

    }

  }
);

// ────────────────────────────────────────────────
// DASHBOARD
// ────────────────────────────────────────────────

function initDashboard() {

  const user =
    currentUser();

  if (!user) {

    showPage(authPage);

    return;
  }

  greetingText.textContent =
    getGreeting();

  todayDate.textContent =
    new Date().toLocaleDateString(
      "en-US",
      {
        weekday: "long",
        month: "long",
        day: "numeric"
      }
    );

  sidebarUser.textContent =
    `👤 ${user.name}`;

  showPage(dashPage);

  loadHabits();

}

// ────────────────────────────────────────────────
// LOAD HABITS
// ────────────────────────────────────────────────

async function loadHabits() {

  const user =
    currentUser();

  if (!user) return;

  try {

    const response =
      await fetch(
        `${API_URL}/habits/${user.user_id}`
      );

    const result =
      await response.json();

    renderHabits(
      result.data || []
    );

  } catch (err) {

    console.error(err);

  }

}

// ────────────────────────────────────────────────
// RENDER HABITS
// ────────────────────────────────────────────────

function renderHabits(habits) {

  habitsGrid.innerHTML = "";

  const total =
    habits.length;

  let completed =
    habits.filter(
      h => h.done_today
    ).length;

  totalCount.textContent =
    total;

  completedCount.textContent =
    completed;

  const pct =
    total > 0
      ? Math.round(
          (
            completed / total
          ) * 100
        )
      : 0;

  overallBar.style.width =
    `${pct}%`;

  progressPct.textContent =
    `${pct}%`;

  if (habits.length === 0) {

    emptyState.style.display =
      "block";

    return;
  }

  emptyState.style.display =
    "none";

  habits.forEach(habit => {

    const card =
      document.createElement("div");

    card.className =
      `habit-card ${
        habit.done_today
          ? "done"
          : ""
      }`;

    card.dataset.id =
      habit.habit_id;

    card.innerHTML = `

      <div class="habit-top">

        <div class="habit-emoji">
          ${habit.emoji || "🌿"}
        </div>

        <div class="habit-info">

          <div class="habit-name">
            ${escHtml(
              habit.habit_name
            )}
          </div>

          <div class="habit-streak">

            🔥

            <span class="streak-number">
              ${habit.streak || 0}
            </span>

            day streak

          </div>

        </div>

        <div class="habit-actions">

          <button
            class="btn-done ${
              habit.done_today
                ? "completed"
                : ""
            }"
          >

            ${
              habit.done_today
                ? "✓ Done"
                : "Mark Done"
            }

          </button>

          <button
            class="btn-delete"
          >
            🗑
          </button>

        </div>

      </div>

    `;

    // DONE BUTTON
    card
      .querySelector(".btn-done")
      .addEventListener(
        "click",
        () => {

          const btn =
            card.querySelector(
              ".btn-done"
            );

          if (
            btn.classList.contains(
              "completed"
            )
          ) {
            return;
          }

          btn.classList.add(
            "completed"
          );

          btn.textContent =
            "✓ Done";

          card.classList.add(
            "done"
          );

          const streakEl =
            card.querySelector(
              ".streak-number"
            );

          let current =
            Number(
              streakEl.textContent
            ) || 0;

          current++;

          streakEl.textContent =
            current;

          completed++;

          completedCount.textContent =
            completed;

          const pct =
            total > 0
              ? Math.round(
                  (
                    completed /
                    total
                  ) * 100
                )
              : 0;

          overallBar.style.width =
            `${pct}%`;

          progressPct.textContent =
            `${pct}%`;

        }
      );

    // DELETE BUTTON
    card
      .querySelector(".btn-delete")
      .addEventListener(
        "click",
        () => {

          pendingDeleteId =
            habit.habit_id;

          deleteModal.style.display =
            "flex";

        }
      );

    habitsGrid.appendChild(
      card
    );

  });

}

// ────────────────────────────────────────────────
// ADD HABIT
// ────────────────────────────────────────────────

addTriggerBtn.addEventListener(
  "click",
  () => {

    addForm.style.display =
      "block";

    addTriggerBtn.style.display =
      "none";

  }
);

addCancelBtn.addEventListener(
  "click",
  closeAddForm
);

function closeAddForm() {

  addForm.style.display =
    "none";

  addTriggerBtn.style.display =
    "flex";

  newHabitName.value = "";

  addError.textContent = "";

}

addConfirmBtn.addEventListener(
  "click",
  async () => {

    const title =
      newHabitName.value.trim();

    if (!title) {

      addError.textContent =
        "Enter habit name";

      return;
    }

    const user =
      currentUser();

    try {

      const response =
        await fetch(
          `${API_URL}/habits`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({

              user_id:
                user.user_id,

              title

            })

          }
        );

      const data =
        await response.json();

      if (!data.success) {

        addError.textContent =
          data.error || "Failed";

        return;
      }

      closeAddForm();

      loadHabits();

    } catch (err) {

      console.error(err);

      addError.textContent =
        "Server error";

    }

  }
);

// ────────────────────────────────────────────────
// DELETE HABIT
// ────────────────────────────────────────────────

modalCancel.addEventListener(
  "click",
  () => {

    deleteModal.style.display =
      "none";

  }
);

modalConfirm.addEventListener(
  "click",
  async () => {

    if (!pendingDeleteId)
      return;

    try {

      await fetch(
        `${API_URL}/habits/${pendingDeleteId}`,
        {
          method: "DELETE"
        }
      );

      deleteModal.style.display =
        "none";

      pendingDeleteId = null;

      loadHabits();

    } catch (err) {

      console.error(err);

    }

  }
);

// ────────────────────────────────────────────────
// LOGOUT
// ────────────────────────────────────────────────

function logout() {

  clearSession();

  showPage(authPage);

}

logoutBtn.addEventListener(
  "click",
  logout
);

logoutBtnMobile.addEventListener(
  "click",
  logout
);

// ────────────────────────────────────────────────
// INIT
// ────────────────────────────────────────────────

(function init() {

  const user =
    currentUser();

  if (user) {

    initDashboard();

  } else {

    showPage(authPage);

  }

})();