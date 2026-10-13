import { NextRequest, NextResponse } from "next/server";
import { catalogService } from "@/server/services/catalog.service";
import { successResponse, errorResponse } from "@/utils/api-response";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json(errorResponse("Collection slug required", "INVALID_SLUG"), {
        status: 400,
      });
    }

    const { searchParams } = new URL(request.url);
    const rawPage = parseInt(searchParams.get("page") || "1", 10);
    const page = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;

    const rawLimit = parseInt(searchParams.get("limit") || "12", 10);
    const limit = isNaN(rawLimit) || rawLimit < 1 ? 12 : Math.min(50, rawLimit);

    const sortParam = searchParams.get("sort");
    const validSorts = ["recommended", "newest", "price_asc", "price_desc"] as const;
    const sort = validSorts.includes(sortParam as typeof validSorts[number])
      ? (sortParam as typeof validSorts[number])
      : "recommended";

    const data = await catalogService.getCollectionProducts(slug, {
      page,
      limit,
      sort,
    });

    if (!data) {
      return NextResponse.json(
        errorResponse("Collection not found", "COLLECTION_NOT_FOUND"),
        { status: 404 }
      );
    }

    return NextResponse.json(
      successResponse(
        {
          collection: data.collection,
          products: data.result.products,
        },
        {
          total: data.result.total,
          page: data.result.page,
          limit: data.result.limit,
          totalPages: data.result.totalPages,
          hasMore: data.result.page < data.result.totalPages,
        }
      )
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load collection products";
    return NextResponse.json(errorResponse(message, "COLLECTION_PRODUCTS_ERROR"), {
      status: 500,
    });
  }
}
