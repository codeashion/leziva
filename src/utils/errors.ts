/**
 * Application Error Hierarchy for LEZIVA
 * Provides standardized, typed error classes for consistent error handling and HTTP status mapping.
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode = 500,
    code = "INTERNAL_SERVER_ERROR",
    details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation failed", details?: unknown) {
    super(message, 400, "VALIDATION_ERROR", details);
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Bad request", details?: unknown) {
    super(message, 400, "BAD_REQUEST", details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required", details?: unknown) {
    super(message, 401, "UNAUTHORIZED", details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Access forbidden", details?: unknown) {
    super(message, 403, "FORBIDDEN", details);
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "Resource", identifier?: string | number) {
    const msg = identifier
      ? `${resource} with identifier '${identifier}' was not found.`
      : `${resource} not found.`;
    super(msg, 404, "NOT_FOUND", { resource, identifier });
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource conflict detected", details?: unknown) {
    super(message, 409, "CONFLICT", details);
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Too many requests. Please slow down.") {
    super(message, 429, "RATE_LIMIT_EXCEEDED");
  }
}

export class IntegrationError extends AppError {
  constructor(
    service: "Razorpay" | "Velocity" | "Redis" | "Database" | "Email",
    message: string,
    details?: unknown
  ) {
    super(
      `Integration error [${service}]: ${message}`,
      502,
      `INTEGRATION_ERROR_${service.toUpperCase()}`,
      details
    );
  }
}
