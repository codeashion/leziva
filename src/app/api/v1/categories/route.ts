import { NextResponse } from "next/server";
import { catalogService } from "@/server/services/catalog.service";
import { successResponse, errorResponse } from "@/utils/api-response";

export async function GET() {
  try {
    const categories = await catalogService.getCategories();
    return NextResponse.json(
      successResponse(categories, { count: categories.length })
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load categories";
    return NextResponse.json(errorResponse(message, "CATEGORIES_FETCH_ERROR"), {
      status: 500,
    });
  }
}
