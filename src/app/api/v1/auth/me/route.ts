import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/guards";
import { apiSuccess, apiError } from "@/utils/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    return apiSuccess({ user });
  } catch (error) {
    return apiError(error);
  }
}
