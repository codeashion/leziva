import { NextRequest } from "next/server";
import { authService } from "@/server/services/auth.service";
import { registerSchema } from "@/shared/validations/auth";
import { apiSuccess, apiError } from "@/utils/api-response";
import {
  extractRequestContext,
  setSessionCookie,
} from "@/server/auth/guards";
import { redisService } from "@/server/redis/client";
import { RateLimitError, ValidationError } from "@/utils/errors";

export async function POST(req: NextRequest) {
  const ctx = extractRequestContext(req);

  try {
    // 1. Rate Limiting: 5 registrations per 10 minutes per IP
    const rateLimit = await redisService.checkRateLimit(
      "register",
      ctx.ipAddress || "global",
      5,
      600
    );
    if (!rateLimit.allowed) {
      throw new RateLimitError("Too many registration attempts. Please try again later.");
    }

    // 2. Parse and Validate Request Payload
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ValidationError("Malformed JSON request body.");
    }

    const parseResult = registerSchema.safeParse(body);
    if (!parseResult.success) {
      return apiError(
        new ValidationError("Validation failed", parseResult.error.format())
      );
    }

    // 3. Delegate to AuthService
    const result = await authService.register(parseResult.data, ctx);

    // 4. Set HttpOnly Session Cookie & Return Response
    const response = apiSuccess(
      {
        user: result.user,
        message: "Account registered successfully.",
      },
      undefined,
      201
    );

    setSessionCookie(response, result.sessionToken, result.expiresAt);
    return response;
  } catch (error) {
    return apiError(error);
  }
}
