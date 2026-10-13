import { NextRequest, NextResponse } from "next/server";
import { catalogService } from "@/server/services/catalog.service";
import { successResponse, errorResponse } from "@/utils/api-response";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json(errorResponse("Product slug is required.", "INVALID_SLUG"), {
        status: 400,
      });
    }

    const data = await catalogService.getProductBySlug(slug);
    if (!data) {
      return NextResponse.json(
        errorResponse("Product not found or currently unavailable.", "PRODUCT_NOT_FOUND"),
        { status: 404 }
      );
    }

    return NextResponse.json(
      successResponse({
        product: data.product,
        related: data.related,
      })
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load product";
    return NextResponse.json(errorResponse(message, "PRODUCT_FETCH_ERROR"), {
      status: 500,
    });
  }
}
