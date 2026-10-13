import { NextRequest, NextResponse } from "next/server";
import { cartService } from "@/server/services/cart.service";
import {
  authenticateRequest,
  getGuestCartIdFromRequest,
  setGuestCartCookie,
} from "@/server/auth/guards";
import { successResponse, errorResponse } from "@/utils/api-response";
import { BadRequestError, NotFoundError } from "@/utils/errors";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    let guestCartId = getGuestCartIdFromRequest(request);
    let shouldSetGuestCookie = false;

    if (!user && !guestCartId) {
      guestCartId = `gst_${crypto.randomUUID()}`;
      shouldSetGuestCookie = true;
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        errorResponse("Invalid request body. Expected JSON object.", "INVALID_BODY"),
        { status: 400 }
      );
    }

    const { variantId, quantity = 1 } = body;
    if (!variantId || typeof variantId !== "string") {
      return NextResponse.json(
        errorResponse("variantId is required and must be a string.", "INVALID_VARIANT_ID"),
        { status: 400 }
      );
    }

    const parsedQty = Number(quantity);
    if (isNaN(parsedQty) || parsedQty <= 0 || !Number.isInteger(parsedQty)) {
      return NextResponse.json(
        errorResponse("quantity must be a positive integer.", "INVALID_QUANTITY"),
        { status: 400 }
      );
    }

    const updatedCart = await cartService.addItem(
      {
        userId: user?.id,
        guestCartId: user ? undefined : guestCartId,
      },
      variantId,
      parsedQty
    );

    const res = NextResponse.json(
      successResponse(updatedCart, { message: "Item added to cart." })
    );

    if (shouldSetGuestCookie && guestCartId) {
      setGuestCartCookie(res, guestCartId);
    }

    return res;
  } catch (error) {
    if (error instanceof BadRequestError) {
      return NextResponse.json(errorResponse(error.message, "BAD_REQUEST"), {
        status: 400,
      });
    }
    if (error instanceof NotFoundError) {
      return NextResponse.json(errorResponse(error.message, "NOT_FOUND"), {
        status: 404,
      });
    }
    const message = error instanceof Error ? error.message : "Failed to add item to cart";
    return NextResponse.json(errorResponse(message, "CART_ADD_ERROR"), {
      status: 500,
    });
  }
}
