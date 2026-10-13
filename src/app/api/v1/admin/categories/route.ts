import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/server/auth/guards";
import { Permissions } from "@/server/auth/rbac.service";
import { adminCategoryService } from "@/server/services/admin-category.service";
import { BadRequestError } from "@/utils/errors";

export async function GET(req: NextRequest) {
  try {
    await requirePermission(req, Permissions.CATEGORIES_READ);
    const categories = await adminCategoryService.listCategories();
    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load categories";
    return NextResponse.json({ success: false, error: { message } }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requirePermission(req, Permissions.CATEGORIES_WRITE);
    const body = await req.json();
    const created = await adminCategoryService.createCategory(body, user.id);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    const status = error instanceof BadRequestError ? 400 : 500;
    const message = error instanceof Error ? error.message : "Failed to create category";
    return NextResponse.json({ success: false, error: { message } }, { status });
  }
}
