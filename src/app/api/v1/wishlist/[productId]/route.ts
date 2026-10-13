import { NextRequest, NextResponse } from "next/server";
import { wishlistService } from "@/server/services/wishlist.service";
import { authenticateRequest, getGuestWishlistIdFromRequest } from "@/server/auth/guards";
import { successResponse, errorResponse } from "@/utils/api-response";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;
    if (!productId) {
      return NextResponse.json(errorResponse("productId required", "INVALID_PRODUCT_ID"), {
        status: 400,
      });
    }

    const user = await authenticateRequest(request);
    const guestWishlistId = getGuestWishlistIdFromRequest(request);

    const updatedWishlist = await wishlistService.removeFromWishlist(
      productId,
      {
        userId: user?.id,
        guestWishlistId: user ? undefined : guestWishlistId,
      }
    );

    return NextResponse.json(
      successResponse(updatedWishlist, {
        message: "Product removed from wishlist.",
        count: updatedWishlist.length,
      })
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to remove product from wishlist";
    return NextResponse.json(errorResponse(message, "WISHLIST_REMOVE_ERROR"), {
      status: 500,
    });
  }
}
