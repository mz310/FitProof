import { AppError } from "../errors.js";

export const errorHandler = (err, req, res, _next) => {
  const isKnown = err instanceof AppError;
  const status = isKnown ? err.statusCode : 500;
  const payload = {
    error: isKnown ? err.name : "InternalServerError",
    message: err.message || "Server error",
  };

  if (isKnown && err.details && Object.keys(err.details).length) {
    payload.details = err.details;
  }

  // Basic logging to stdout; can be replaced with Winston/Pino later
  const logContext = {
    method: req.method,
    path: req.originalUrl,
    status,
    name: err.name,
    message: err.message,
    details: err.details,
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  };
  console.error("[ERROR]", JSON.stringify(logContext));

  res.status(status).json(payload);
};
