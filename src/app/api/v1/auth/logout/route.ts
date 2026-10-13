import { NextRequest } from "next/server";
import { authService } from "@/server/services/auth.service";
import { apiSuccess, apiError } from "@/utils/api-response";
import {
  extractRequestContext,
  getSessionTokenFromRequest,
  clearSessionCookie,
} from "@/server/auth/guards";

export async function POST(req: NextRequest) {
  const ctx = extractRequestContext(req);
  const token = getSessionTokenFromRequest(req);

  try {
    if (token) {
      await authService.logout(token, ctx);
    }

    const response = apiSuccess({
      message: "Successfully signed out of session.",
    });

    clearSessionCookie(response);
    return response;
  } catch (error) {
    return apiError(error);
  }
}
