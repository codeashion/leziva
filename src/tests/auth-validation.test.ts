import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  registerSchema,
  loginSchema,
  resetPasswordSchema,
} from "../shared/validations/auth";

describe("Authentication Input Validation Schemas", () => {
  it("should validate a valid registration payload and normalize email", () => {
    const payload = {
      email: "  Priya.Sharma@Leziva.COM  ",
      password: "StrongPassword123!",
      name: "Priya Sharma",
    };

    const result = registerSchema.safeParse(payload);
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.email, "priya.sharma@leziva.com");
      assert.equal(result.data.name, "Priya Sharma");
    }
  });

  it("should reject registration with weak password lacking uppercase or numbers", () => {
    const payload = {
      email: "test@leziva.com",
      password: "weakpassword",
    };

    const result = registerSchema.safeParse(payload);
    assert.equal(result.success, false);
  });

  it("should reject registration with invalid email format", () => {
    const payload = {
      email: "not-an-email",
      password: "StrongPassword123!",
    };

    const result = registerSchema.safeParse(payload);
    assert.equal(result.success, false);
  });

  it("should validate login credentials schema", () => {
    const payload = {
      email: "CUSTOMER@LEZIVA.COM",
      password: "AnyPassword123!",
    };

    const result = loginSchema.safeParse(payload);
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.email, "customer@leziva.com");
    }
  });

  it("should reject reset password payload with short token", () => {
    const payload = {
      token: "short",
      newPassword: "NewValidPassword123!",
    };

    const result = resetPasswordSchema.safeParse(payload);
    assert.equal(result.success, false);
  });
});
