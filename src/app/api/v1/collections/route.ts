import { NextResponse } from "next/server";
import { catalogService } from "@/server/services/catalog.service";
import { successResponse, errorResponse } from "@/utils/api-response";

export async function GET() {
  try {
    const collections = await catalogService.getCollections();
    return NextResponse.json(
      successResponse(collections, { count: collections.length })
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load collections";
    return NextResponse.json(errorResponse(message, "COLLECTIONS_FETCH_ERROR"), {
      status: 500,
    });
  }
}
