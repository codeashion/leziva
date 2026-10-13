import { NextRequest } from "next/server";
import { authService } from "@/server/services/auth.service";
import { forgotPasswordSchema } from "@/shared/validations/auth";
import { apiSuccess, apiError } from "@/utils/api-response";
import { extractRequestContext } from "@/server/auth/guards";
import { redisService } from "@/server/redis/client";
import { RateLimitError, ValidationError } from "@/utils/errors";

export async function POST(req: NextRequest) {
  const ctx = extractRequestContext(req);

  try {
    // 1. Rate Limit: 3 requests per 10 minutes per IP
    const rateLimit = await redisService.checkRateLimit(
      "forgot_password",
      ctx.ipAddress || "global",
      3,
      600
    );
    if (!rateLimit.allowed) {
      throw new RateLimitError("Too many password reset requests. Please try again later.");
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ValidationError("Malformed JSON request body.");
    }

    const parseResult = forgotPasswordSchema.safeParse(body);
    if (!parseResult.success) {
      return apiError(
        new ValidationError("Validation failed", parseResult.error.format())
      );
    }

    const result = await authService.requestPasswordReset(parseResult.data.email, ctx);
    return apiSuccess(result);
  } catch (error) {
    return apiError(error);
  }
}
