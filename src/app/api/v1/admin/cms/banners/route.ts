import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/server/auth/guards";
import { Permissions } from "@/server/auth/rbac.service";
import { cmsService } from "@/server/services/cms.service";
import { successResponse, errorResponse } from "@/utils/api-response";

export async function GET(request: NextRequest) {
  try {
    await requirePermission(request, Permissions.CMS_READ);
    const banners = await cmsService.getBanners();
    return NextResponse.json(successResponse(banners));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load banners";
    return NextResponse.json(errorResponse(message, "CMS_BANNER_ERROR"), { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission(request, Permissions.CMS_WRITE);
    const body = await request.json().catch(() => null);

    if (!body || !body.title || !body.imageUrl) {
      return NextResponse.json(errorResponse("Title and image URL are required.", "INVALID_INPUT"), { status: 400 });
    }

    const saved = await cmsService.saveBanner(body, user.id);
    return NextResponse.json(successResponse(saved, { message: "Hero banner saved." }));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to save banner";
    return NextResponse.json(errorResponse(message, "CMS_BANNER_SAVE_ERROR"), { status: 400 });
  }
}
