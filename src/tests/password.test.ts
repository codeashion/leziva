import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword } from "../server/auth/password";

describe("Password Hashing & Verification (Security)", () => {
  it("should securely hash a password using bcrypt", async () => {
    const raw = "RoyalSaree2026!";
    const hash = await hashPassword(raw);

    assert.notEqual(raw, hash);
    assert.equal(hash.startsWith("$2"), true); // bcrypt identifier
  });

  it("should successfully verify the correct password", async () => {
    const raw = "RoyalSaree2026!";
    const hash = await hashPassword(raw);
    const isValid = await verifyPassword(raw, hash);

    assert.equal(isValid, true);
  });

  it("should reject an incorrect password", async () => {
    const raw = "RoyalSaree2026!";
    const hash = await hashPassword(raw);
    const isValid = await verifyPassword("WrongPassword123!", hash);

    assert.equal(isValid, false);
  });

  it("should reject passwords that are too short (< 8 chars)", async () => {
    await assert.rejects(
      async () => {
        await hashPassword("short");
      },
      /Password must be at least 8 characters/
    );
  });

  it("should safely handle empty password comparisons without throwing", async () => {
    const isValid = await verifyPassword("", "$2a$12$somehash");
    assert.equal(isValid, false);
  });
});
