import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  AppError,
  ValidationError,
  NotFoundError,
  IntegrationError,
} from "../utils/errors";

describe("Application Error Hierarchy", () => {
  it("should create AppError with proper status code and default code", () => {
    const error = new AppError("Internal crash", 500);
    assert.equal(error.statusCode, 500);
    assert.equal(error.code, "INTERNAL_SERVER_ERROR");
    assert.equal(error.isOperational, true);
  });

  it("should properly structure ValidationError with 400 status", () => {
    const error = new ValidationError("Invalid SKU format", { field: "sku" });
    assert.equal(error.statusCode, 400);
    assert.equal(error.code, "VALIDATION_ERROR");
    assert.deepEqual(error.details, { field: "sku" });
  });

  it("should format NotFoundError with resource and identifier", () => {
    const error = new NotFoundError("Product", "prod_123");
    assert.equal(error.statusCode, 404);
    assert.equal(error.code, "NOT_FOUND");
    assert.match(error.message, /prod_123/);
  });

  it("should configure IntegrationError with service tag", () => {
    const error = new IntegrationError("Velocity", "Courier pincode unreachable");
    assert.equal(error.statusCode, 502);
    assert.equal(error.code, "INTEGRATION_ERROR_VELOCITY");
    assert.match(error.message, /Velocity/);
  });
});
