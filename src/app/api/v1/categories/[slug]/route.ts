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
      return NextResponse.json(errorResponse("Category slug required", "INVALID_SLUG"), {
        status: 400,
      });
    }

    const category = await catalogService.getCategoryBySlug(slug);
    if (!category) {
      return NextResponse.json(
        errorResponse("Category not found", "CATEGORY_NOT_FOUND"),
        { status: 404 }
      );
    }

    return NextResponse.json(successResponse(category));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load category";
    return NextResponse.json(errorResponse(message, "CATEGORY_FETCH_ERROR"), {
      status: 500,
    });
  }
}
