import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/server/auth/guards";
import { Permissions } from "@/server/auth/rbac.service";
import { cmsService } from "@/server/services/cms.service";
import { successResponse, errorResponse } from "@/utils/api-response";

export async function GET(request: NextRequest) {
  try {
    await requirePermission(request, Permissions.CMS_READ);
    const pages = await cmsService.getPages();
    return NextResponse.json(successResponse(pages));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load pages";
    return NextResponse.json(errorResponse(message, "CMS_ERROR"), { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission(request, Permissions.CMS_WRITE);
    const body = await request.json().catch(() => null);

    if (!body || !body.slug || !body.title || !body.content) {
      return NextResponse.json(errorResponse("Slug, title, and content are required.", "INVALID_INPUT"), { status: 400 });
    }

    const saved = await cmsService.upsertPage(body, user.id);
    return NextResponse.json(successResponse(saved, { message: "CMS page saved." }));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to save CMS page";
    return NextResponse.json(errorResponse(message, "CMS_SAVE_ERROR"), { status: 400 });
  }
}
