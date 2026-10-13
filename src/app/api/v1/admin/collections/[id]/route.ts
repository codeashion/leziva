import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/server/auth/guards";
import { Permissions } from "@/server/auth/rbac.service";
import { adminCategoryService } from "@/server/services/admin-category.service";
import { BadRequestError, NotFoundError } from "@/utils/errors";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePermission(req, Permissions.CATEGORIES_WRITE);
    const { id } = await params;
    const body = await req.json();
    const updated = await adminCategoryService.updateCollection(id, body, user.id);
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    const status = error instanceof NotFoundError ? 404 : error instanceof BadRequestError ? 400 : 500;
    const message = error instanceof Error ? error.message : "Failed to update collection";
    return NextResponse.json({ success: false, error: { message } }, { status });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePermission(req, Permissions.CATEGORIES_WRITE);
    const { id } = await params;
    const result = await adminCategoryService.deleteCollection(id, user.id);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const status = error instanceof NotFoundError ? 404 : error instanceof BadRequestError ? 400 : 500;
    const message = error instanceof Error ? error.message : "Failed to delete collection";
    return NextResponse.json({ success: false, error: { message } }, { status });
  }
}
