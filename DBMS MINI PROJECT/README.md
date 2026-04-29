# 🌿 Habit Tracker — Backend API

Node.js + Express + MySQL backend for the Habit Tracker with Streak System.

---

## Folder Structure

```
habit-backend/
├── server.js                  ← Express app entry point
├── package.json
├── .env.example               ← Copy to .env and fill in credentials
├── schema.sql                 ← Run once to create DB + tables
├── frontend-integration.js    ← Fetch helpers to connect your frontend
│
├── config/
│   └── db.js                  ← MySQL connection pool
│
├── routes/
│   ├── userRoutes.js
│   ├── habitRoutes.js
│   └── logRoutes.js
│
├── controllers/
│   ├── userController.js
│   ├── habitController.js
│   └── logController.js
│
├── middleware/
│   └── errorHandler.js        ← Global error handler + createError()
│
└── utils/
    └── streak.js              ← calcStreak, calcBestStreak helpers
```

---

## Setup

### 1. Install dependencies
```bash
cd habit-backend
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your MySQL credentials
```

### 3. Create the database & tables
```bash
mysql -u root -p < schema.sql
```
Or paste the contents of `schema.sql` into MySQL Workbench / phpMyAdmin.

### 4. Start the server
```bash
npm run dev     # development (auto-restarts with nodemon)
npm start       # production
```

Server starts at **http://localhost:3000**

---

## API Reference

### Health Check
```
GET /
```
Returns API info and available endpoints.

---

### User Endpoints

#### Register a user
```
POST /register
Body: { "name": "Alice", "email": "alice@example.com" }
```
```json
{
  "success": true,
  "message": "User registered successfully.",
  "data": { "user_id": 1, "name": "Alice", "email": "alice@example.com" }
}
```

#### Get all users
```
GET /users
```

#### Get single user
```
GET /users/:user_id
```

---

### Habit Endpoints

#### Add a habit
```
POST /habits
Body: { "user_id": 1, "habit_name": "Morning Run", "emoji": "🏃" }
```

#### Get habits for a user (with streaks)
```
GET /habits/1
```
```json
{
  "success": true,
  "data": [
    {
      "habit_id": 1,
      "habit_name": "Morning Run",
      "emoji": "🏃",
      "streak": 5,
      "best_streak": 12,
      "done_today": true,
      "total_days": 18
    }
  ]
}
```

#### Delete a habit
```
DELETE /habits/:id
```

---

### Log Endpoints

#### Mark habit as done today
```
POST /log
Body: { "habit_id": 1 }
      { "habit_id": 1, "date": "2025-10-15" }   ← optional past date
```

#### Get habit log history
```
GET /log/:habit_id
GET /log/:habit_id?days=30    ← last 30 days only
```

#### Get last 7 days (for calendar dots)
```
GET /log/:habit_id/week
```
```json
{
  "data": [
    { "date": "2025-10-09", "status": "done",       "done": true  },
    { "date": "2025-10-10", "status": "not_logged",  "done": false },
    { "date": "2025-10-11", "status": "done",        "done": true  }
  ]
}
```

---

## Streak Logic

Streaks are calculated server-side in `utils/streak.js`:

- Walking backwards from today, count consecutive "done" days
- If today isn't logged yet, the streak starts from yesterday (user still has time)
- A single missed day resets the streak to 0
- `best_streak` = longest consecutive run ever

---

## Connecting to Your Frontend

1. Copy `frontend-integration.js` into your frontend folder
2. Add it to `index.html` before `app.js`:
   ```html
   <script src="frontend-integration.js"></script>
   <script src="app.js"></script>
   ```
3. Replace localStorage calls with the `api*` functions — see the comments
   in `frontend-integration.js` for a side-by-side comparison.
