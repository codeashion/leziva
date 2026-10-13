import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  generateSecureToken,
  hashToken,
  normalizeEmail,
} from "../server/auth/tokens";

describe("Token & Cryptographic Utilities", () => {
  it("should generate cryptographically random hex tokens", () => {
    const token1 = generateSecureToken(32);
    const token2 = generateSecureToken(32);

    assert.equal(token1.length, 64); // 32 bytes hex = 64 characters
    assert.equal(token2.length, 64);
    assert.notEqual(token1, token2);
  });

  it("should generate deterministic SHA-256 hash for secure database storage", () => {
    const token = "my-secret-session-token-123456";
    const hash1 = hashToken(token);
    const hash2 = hashToken(token);

    assert.equal(hash1, hash2);
    assert.equal(hash1.length, 64);
    assert.notEqual(hash1, token);
  });

  it("should normalize email addresses uniformly", () => {
    const input = "  Customer.Care@Leziva.COM  ";
    const normalized = normalizeEmail(input);

    assert.equal(normalized, "customer.care@leziva.com");
  });

  it("should handle empty or null email values safely", () => {
    assert.equal(normalizeEmail(""), "");
  });
});
