export class AppError extends Error {
  constructor(message, statusCode = 500, details = {}) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation error", details = {}) {
    super(message, 400, details);
  }
}

export class AuthError extends AppError {
  constructor(message = "Authentication required") {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Insufficient permissions") {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "Resource", id = "") {
    const msg = id ? `${resource} not found: ${id}` : `${resource} not found`;
    super(msg, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict") {
    super(message, 409);
  }
}

export class DatabaseError extends AppError {
  constructor(message = "Database error", details = {}) {
    super(message, 500, details);
  }
}
