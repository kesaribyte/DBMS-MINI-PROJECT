-- ═══════════════════════════════════════════════════════════
--  Habit Tracker — MySQL Schema
--  Run this file once to set up the database.
--
--  Usage:
--    mysql -u root -p < schema.sql
--  or paste into MySQL Workbench / phpMyAdmin / DBeaver.
-- ═══════════════════════════════════════════════════════════

-- Create and select the database
CREATE DATABASE IF NOT EXISTS habit_tracker
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE habit_tracker;


-- ───────────────────────────────────────────────────────────
--  Table: users
--  Stores registered app users.
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  user_id    INT          NOT NULL AUTO_INCREMENT,
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(255) NOT NULL UNIQUE,        -- unique email per user
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (user_id)
) ENGINE=InnoDB;


-- ───────────────────────────────────────────────────────────
--  Table: habits
--  Each habit belongs to one user.
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS habits (
  habit_id   INT          NOT NULL AUTO_INCREMENT,
  user_id    INT          NOT NULL,
  habit_name VARCHAR(150) NOT NULL,
  emoji      VARCHAR(10)  NOT NULL DEFAULT '🏃',  -- optional icon
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (habit_id),

  -- Foreign key: deleting a user cascades to their habits
  CONSTRAINT fk_habits_user
    FOREIGN KEY (user_id) REFERENCES users (user_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB;


-- ───────────────────────────────────────────────────────────
--  Table: habit_log
--  One row per (habit, date) pair — tracks completion status.
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS habit_log (
  log_id     INT     NOT NULL AUTO_INCREMENT,
  habit_id   INT     NOT NULL,
  log_date   DATE    NOT NULL,                    -- stored as YYYY-MM-DD
  status     ENUM('done', 'missed') NOT NULL DEFAULT 'done',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (log_id),

  -- Prevent duplicate entries for the same habit on the same day
  UNIQUE KEY uq_habit_date (habit_id, log_date),

  -- Foreign key: deleting a habit cascades to its log entries
  CONSTRAINT fk_log_habit
    FOREIGN KEY (habit_id) REFERENCES habits (habit_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB;


-- ───────────────────────────────────────────────────────────
--  Sample seed data (optional — comment out if not needed)
-- ───────────────────────────────────────────────────────────

-- Insert two sample users
INSERT IGNORE INTO users (name, email) VALUES
  ('Alice',   'alice@example.com'),
  ('Bob',     'bob@example.com');

-- Insert sample habits for Alice (user_id = 1)
INSERT IGNORE INTO habits (user_id, habit_name, emoji) VALUES
  (1, 'Morning Run',   '🏃'),
  (1, 'Read 20 Pages', '📚'),
  (1, 'Drink Water',   '💧');

-- Insert some log entries to demonstrate streaks
INSERT IGNORE INTO habit_log (habit_id, log_date, status) VALUES
  -- Morning Run: 5-day streak ending today
  (1, CURDATE() - INTERVAL 4 DAY, 'done'),
  (1, CURDATE() - INTERVAL 3 DAY, 'done'),
  (1, CURDATE() - INTERVAL 2 DAY, 'done'),
  (1, CURDATE() - INTERVAL 1 DAY, 'done'),
  (1, CURDATE(),                  'done'),
  -- Read: 2-day streak
  (2, CURDATE() - INTERVAL 1 DAY, 'done'),
  (2, CURDATE(),                  'done');
