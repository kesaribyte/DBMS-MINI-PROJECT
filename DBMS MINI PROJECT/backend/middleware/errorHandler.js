// ─────────────────────────────────────────────────────────
// middleware/errorHandler.js
//
// Central Express error handler — catches any error passed
// via next(err) and returns a clean JSON response.
// ─────────────────────────────────────────────────────────

/**
 * Global error handler middleware.
 * Must be registered LAST with app.use() in server.js.
 */
function errorHandler(err, req, res, next) {  // eslint-disable-line no-unused-vars
  // Log the full error on the server for debugging
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);
  if (process.env.NODE_ENV !== "production") {
    console.error(err.stack);
  }

  // Determine HTTP status code
  const status = err.status || err.statusCode || 500;

  res.status(status).json({
    success: false,
    error:   err.message || "Internal Server Error",
    // Only include stack trace in development mode
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
}

/**
 * Helper: creates a typed error with a custom HTTP status code.
 * Usage: throw createError(404, "User not found")
 */
function createError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

module.exports = { errorHandler, createError };
