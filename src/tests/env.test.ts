import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { serverEnvSchema, clientEnvSchema } from "../shared/validations/env";

describe("Environment Validation Schema", () => {
  it("should validate default client environment values", () => {
    const result = clientEnvSchema.safeParse({
      NEXT_PUBLIC_APP_URL: "https://leziva.com",
      NEXT_PUBLIC_BRAND_NAME: "LEZIVA",
    });

    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.NEXT_PUBLIC_BRAND_NAME, "LEZIVA");
    }
  });

  it("should validate server environment defaults", () => {
    const result = serverEnvSchema.safeParse({});
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.NODE_ENV, "development");
      assert.match(result.data.EMAIL_FROM, /concierge@leziva\.com/);
      assert.equal(result.data.S3_REGION, "ap-south-1");
    }
  });

  it("should fail validation when DATABASE_URL is not a valid URL", () => {
    const result = serverEnvSchema.safeParse({
      DATABASE_URL: "not-a-valid-url",
    });

    assert.equal(result.success, false);
  });
});
