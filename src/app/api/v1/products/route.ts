import { NextRequest, NextResponse } from "next/server";
import { catalogService } from "@/server/services/catalog.service";
import { successResponse, errorResponse } from "@/utils/api-response";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const category = searchParams.get("category") || undefined;
    const collection = searchParams.get("collection") || undefined;
    const search = searchParams.get("search") || searchParams.get("q") || undefined;
    const size = searchParams.get("size") || undefined;
    const color = searchParams.get("color") || undefined;
    const inStock = searchParams.get("inStock") ? searchParams.get("inStock") === "true" : undefined;
    const featured = searchParams.get("featured") ? searchParams.get("featured") === "true" : undefined;
    const newArrival = searchParams.get("newArrival") ? searchParams.get("newArrival") === "true" : undefined;

    const minPriceRaw = searchParams.get("minPrice");
    const maxPriceRaw = searchParams.get("maxPrice");
    let minPrice: number | undefined;
    let maxPrice: number | undefined;

    if (minPriceRaw !== null) {
      const parsed = Number(minPriceRaw);
      if (isNaN(parsed) || parsed < 0) {
        return NextResponse.json(
          errorResponse("Invalid minPrice. Must be a non-negative number.", "INVALID_FILTER"),
          { status: 400 }
        );
      }
      minPrice = parsed;
    }

    if (maxPriceRaw !== null) {
      const parsed = Number(maxPriceRaw);
      if (isNaN(parsed) || parsed < 0) {
        return NextResponse.json(
          errorResponse("Invalid maxPrice. Must be a non-negative number.", "INVALID_FILTER"),
          { status: 400 }
        );
      }
      maxPrice = parsed;
    }

    if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
      return NextResponse.json(
        errorResponse("minPrice cannot be greater than maxPrice.", "INVALID_PRICE_RANGE"),
        { status: 400 }
      );
    }

    const sortParam = searchParams.get("sort");
    const validSorts = ["recommended", "newest", "price_asc", "price_desc"] as const;
    const sort = validSorts.includes(sortParam as typeof validSorts[number])
      ? (sortParam as typeof validSorts[number])
      : "recommended";

    const rawPage = parseInt(searchParams.get("page") || "1", 10);
    const page = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;

    const rawLimit = parseInt(searchParams.get("limit") || "12", 10);
    const limit = isNaN(rawLimit) || rawLimit < 1 ? 12 : Math.min(50, rawLimit);

    const result = await catalogService.searchProducts({
      category,
      collection,
      search,
      minPrice,
      maxPrice,
      size,
      color,
      inStock,
      featured,
      newArrival,
      sort,
      page,
      limit,
    });

    return NextResponse.json(
      successResponse(result.products, {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        hasMore: result.page < result.totalPages,
      })
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load products";
    return NextResponse.json(errorResponse(message, "PRODUCTS_FETCH_ERROR"), {
      status: 500,
    });
  }
}
