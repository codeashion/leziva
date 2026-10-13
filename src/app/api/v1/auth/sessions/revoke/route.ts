import { NextRequest } from "next/server";
import { authService } from "@/server/services/auth.service";
import {
  requireAuth,
  getSessionTokenFromRequest,
  clearSessionCookie,
} from "@/server/auth/guards";
import { revokeSessionsSchema } from "@/shared/validations/auth";
import { apiSuccess, apiError } from "@/utils/api-response";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const currentToken = getSessionTokenFromRequest(req);

    let all = false;
    try {
      const body = await req.json();
      const parsed = revokeSessionsSchema.safeParse(body);
      if (parsed.success) {
        all = parsed.data.all;
      }
    } catch {
      // Default to revoking current session only
    }

    await authService.revokeSessions(user.id, currentToken || undefined, all);

    const response = apiSuccess({
      message: all
        ? "All active sessions have been revoked across all devices."
        : "Current session has been revoked.",
    });

    clearSessionCookie(response);
    return response;
  } catch (error) {
    return apiError(error);
  }
}
