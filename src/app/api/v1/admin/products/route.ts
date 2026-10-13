import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/server/auth/guards";
import { Permissions } from "@/server/auth/rbac.service";
import { adminProductService } from "@/server/services/admin-product.service";
import { productRepository } from "@/server/repositories/product.repository";
import { successResponse, errorResponse } from "@/utils/api-response";

export async function GET(request: NextRequest) {
  try {
    await requirePermission(request, Permissions.PRODUCTS_READ);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;
    const category = searchParams.get("category") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const result = await productRepository.findProducts({
      search,
      category,
      page,
      limit,
      includeUnpublished: true,
    });

    return NextResponse.json(
      successResponse(result, { message: "Products retrieved." })
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to retrieve products";
    return NextResponse.json(errorResponse(message, "PRODUCTS_ERROR"), { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission(request, Permissions.PRODUCTS_WRITE);
    const body = await request.json().catch(() => null);

    if (!body || !body.title || !body.description) {
      return NextResponse.json(
        errorResponse("Title and description are required.", "INVALID_INPUT"),
        { status: 400 }
      );
    }

    const created = await adminProductService.createProduct(body, user.id);

    return NextResponse.json(
      successResponse(created, { message: "Product created successfully." }),
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create product";
    return NextResponse.json(errorResponse(message, "PRODUCT_CREATE_ERROR"), { status: 400 });
  }
}
