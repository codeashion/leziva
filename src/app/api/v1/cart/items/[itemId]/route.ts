import { NextRequest, NextResponse } from "next/server";
import { cartService } from "@/server/services/cart.service";
import { authenticateRequest, getGuestCartIdFromRequest } from "@/server/auth/guards";
import { successResponse, errorResponse } from "@/utils/api-response";
import { BadRequestError, NotFoundError } from "@/utils/errors";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;
    if (!itemId) {
      return NextResponse.json(errorResponse("Item ID required", "INVALID_ITEM_ID"), {
        status: 400,
      });
    }

    const user = await authenticateRequest(request);
    const guestCartId = getGuestCartIdFromRequest(request);

    if (!user && !guestCartId) {
      return NextResponse.json(errorResponse("Cart identifier required", "UNAUTHORIZED"), {
        status: 401,
      });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        errorResponse("Invalid request body. Expected JSON object.", "INVALID_BODY"),
        { status: 400 }
      );
    }

    const { quantity } = body;
    const parsedQty = Number(quantity);
    if (isNaN(parsedQty) || !Number.isInteger(parsedQty) || parsedQty < 0) {
      return NextResponse.json(
        errorResponse("quantity must be a non-negative integer.", "INVALID_QUANTITY"),
        { status: 400 }
      );
    }

    const updatedCart = await cartService.updateQuantity(
      {
        userId: user?.id,
        guestCartId: user ? undefined : guestCartId,
      },
      itemId,
      parsedQty
    );

    return NextResponse.json(successResponse(updatedCart));
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
    const message = error instanceof Error ? error.message : "Failed to update item quantity";
    return NextResponse.json(errorResponse(message, "CART_UPDATE_ERROR"), {
      status: 500,
    });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;
    if (!itemId) {
      return NextResponse.json(errorResponse("Item ID required", "INVALID_ITEM_ID"), {
        status: 400,
      });
    }

    const user = await authenticateRequest(request);
    const guestCartId = getGuestCartIdFromRequest(request);

    const updatedCart = await cartService.removeItem(
      {
        userId: user?.id,
        guestCartId: user ? undefined : guestCartId,
      },
      itemId
    );

    return NextResponse.json(successResponse(updatedCart));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to remove item from cart";
    return NextResponse.json(errorResponse(message, "CART_REMOVE_ERROR"), {
      status: 500,
    });
  }
}
