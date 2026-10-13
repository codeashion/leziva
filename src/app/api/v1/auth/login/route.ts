import { NextRequest } from "next/server";
import { authService } from "@/server/services/auth.service";
import { cartService } from "@/server/services/cart.service";
import { wishlistService } from "@/server/services/wishlist.service";
import { loginSchema } from "@/shared/validations/auth";
import { apiSuccess, apiError } from "@/utils/api-response";
import {
  extractRequestContext,
  setSessionCookie,
  getGuestCartIdFromRequest,
  getGuestWishlistIdFromRequest,
  clearGuestCartCookie,
  GUEST_WISHLIST_COOKIE_NAME,
} from "@/server/auth/guards";
import { redisService } from "@/server/redis/client";
import { RateLimitError, ValidationError } from "@/utils/errors";

export async function POST(req: NextRequest) {
  const ctx = extractRequestContext(req);

  try {
    // 1. Rate Limiting: 5 attempts per 5 minutes per IP
    const rateLimit = await redisService.checkRateLimit(
      "login",
      ctx.ipAddress || "global",
      5,
      300
    );
    if (!rateLimit.allowed) {
      throw new RateLimitError("Too many login attempts. Please wait 5 minutes before trying again.");
    }

    // 2. Parse & Validate Payload
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ValidationError("Malformed JSON request body.");
    }

    const parseResult = loginSchema.safeParse(body);
    if (!parseResult.success) {
      return apiError(
        new ValidationError("Validation failed", parseResult.error.format())
      );
    }

    // 3. Delegate to AuthService
    const result = await authService.login(parseResult.data, ctx);

    // 4. Set Session Cookie & Return Response
    const response = apiSuccess({
      user: result.user,
      message: "Authentication successful.",
    });

    setSessionCookie(response, result.sessionToken, result.expiresAt);

    // 5. Merge Guest Cart & Guest Wishlist upon successful login
    const guestCartId = getGuestCartIdFromRequest(req);
    if (guestCartId) {
      try {
        await cartService.mergeGuestCart(result.user.id, guestCartId);
        clearGuestCartCookie(response);
      } catch {
        // Continue safely without failing authentication
      }
    }

    const guestWishlistId = getGuestWishlistIdFromRequest(req);
    if (guestWishlistId) {
      try {
        await wishlistService.mergeGuestWishlist(result.user.id, guestWishlistId);
        response.cookies.set({
          name: GUEST_WISHLIST_COOKIE_NAME,
          value: "",
          path: "/",
          expires: new Date(0),
        });
      } catch {
        // Continue safely
      }
    }

    return response;
  } catch (error) {
    return apiError(error);
  }
}
