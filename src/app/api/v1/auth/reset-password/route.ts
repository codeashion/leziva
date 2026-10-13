import { NextRequest } from "next/server";
import { authService } from "@/server/services/auth.service";
import { resetPasswordSchema } from "@/shared/validations/auth";
import { apiSuccess, apiError } from "@/utils/api-response";
import { extractRequestContext } from "@/server/auth/guards";
import { redisService } from "@/server/redis/client";
import { RateLimitError, ValidationError } from "@/utils/errors";

export async function POST(req: NextRequest) {
  const ctx = extractRequestContext(req);

  try {
    // 1. Rate Limit: 5 attempts per 10 minutes per IP
    const rateLimit = await redisService.checkRateLimit(
      "reset_password",
      ctx.ipAddress || "global",
      5,
      600
    );
    if (!rateLimit.allowed) {
      throw new RateLimitError("Too many password reset attempts. Please try again later.");
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ValidationError("Malformed JSON request body.");
    }

    const parseResult = resetPasswordSchema.safeParse(body);
    if (!parseResult.success) {
      return apiError(
        new ValidationError("Validation failed", parseResult.error.format())
      );
    }

    const result = await authService.resetPassword(parseResult.data, ctx);
    return apiSuccess(result);
  } catch (error) {
    return apiError(error);
  }
}
