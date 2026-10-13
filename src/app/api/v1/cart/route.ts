import { NextRequest, NextResponse } from "next/server";
import { cartService } from "@/server/services/cart.service";
import {
  authenticateRequest,
  getGuestCartIdFromRequest,
  setGuestCartCookie,
  clearGuestCartCookie,
} from "@/server/auth/guards";
import { successResponse, errorResponse } from "@/utils/api-response";
import crypto from "crypto";

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    let guestCartId = getGuestCartIdFromRequest(request);
    let shouldSetGuestCookie = false;

    // If logged in and has an old guest cart, merge it
    if (user && guestCartId) {
      const mergedCart = await cartService.mergeGuestCart(user.id, guestCartId);
      const res = NextResponse.json(successResponse(mergedCart));
      clearGuestCartCookie(res);
      return res;
    }

    // If anonymous and has no guest id, generate one
    if (!user && !guestCartId) {
      guestCartId = `gst_${crypto.randomUUID()}`;
      shouldSetGuestCookie = true;
    }

    const cart = await cartService.getCart({
      userId: user?.id,
      guestCartId: user ? undefined : guestCartId,
    });

    const res = NextResponse.json(successResponse(cart));
    if (shouldSetGuestCookie && guestCartId) {
      setGuestCartCookie(res, guestCartId);
    }
    return res;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load cart";
    return NextResponse.json(errorResponse(message, "CART_FETCH_ERROR"), {
      status: 500,
    });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    const guestCartId = getGuestCartIdFromRequest(request);

    const clearedCart = await cartService.clearCart({
      userId: user?.id,
      guestCartId: user ? undefined : guestCartId,
    });

    return NextResponse.json(successResponse(clearedCart));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to clear cart";
    return NextResponse.json(errorResponse(message, "CART_CLEAR_ERROR"), {
      status: 500,
    });
  }
}
