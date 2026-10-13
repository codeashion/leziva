import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/server/auth/guards";
import { Permissions } from "@/server/auth/rbac.service";
import { adminProductService } from "@/server/services/admin-product.service";
import { productRepository } from "@/server/repositories/product.repository";
import { successResponse, errorResponse } from "@/utils/api-response";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requirePermission(request, Permissions.PRODUCTS_READ);
    const { id } = await params;

    const product = await productRepository.findById(id);
    if (!product) {
      return NextResponse.json(errorResponse("Product not found.", "NOT_FOUND"), { status: 404 });
    }

    return NextResponse.json(successResponse(product));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load product";
    return NextResponse.json(errorResponse(message, "PRODUCT_ERROR"), { status: 400 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requirePermission(request, Permissions.PRODUCTS_WRITE);
    const { id } = await params;
    const body = await request.json().catch(() => null);

    if (!body) {
      return NextResponse.json(errorResponse("Invalid request body.", "INVALID_INPUT"), { status: 400 });
    }

    const updated = await adminProductService.updateProduct(id, body, user.id);
    return NextResponse.json(successResponse(updated, { message: "Product updated." }));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update product";
    return NextResponse.json(errorResponse(message, "PRODUCT_UPDATE_ERROR"), { status: 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requirePermission(request, Permissions.PRODUCTS_ARCHIVE);
    const { id } = await params;

    const archived = await adminProductService.archiveProduct(id, user.id);
    return NextResponse.json(successResponse(archived, { message: "Product safely archived." }));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to archive product";
    return NextResponse.json(errorResponse(message, "PRODUCT_ARCHIVE_ERROR"), { status: 400 });
  }
}
