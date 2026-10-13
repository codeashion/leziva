import { NextRequest, NextResponse } from "next/server";
import { orderService } from "@/server/services/order.service";
import { authenticateRequest, getGuestCartIdFromRequest } from "@/server/auth/guards";
import { cartService } from "@/server/services/cart.service";
import { successResponse, errorResponse } from "@/utils/api-response";

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    const guestCartId = getGuestCartIdFromRequest(request);
    const body = await request.json().catch(() => ({}));

    let items = body.items;

    // If items not sent in body, load active cart
    if (!items || items.length === 0) {
      const cart = await cartService.getCart({
        userId: user?.id,
        guestCartId,
      });
      items = cart.items.map((i) => ({
        variantId: i.variantId,
        quantity: i.quantity,
      }));
    }

    if (!items || items.length === 0) {
      return NextResponse.json(errorResponse("Cart is empty; cannot generate checkout quote", "EMPTY_CART"), {
        status: 400,
      });
    }

    const quote = await orderService.getCheckoutQuote({
      items,
      couponCode: body.couponCode,
      paymentMethod: body.paymentMethod,
      userId: user?.id,
      customerEmail: user?.email || body.customerEmail,
      shippingPincode: body.shippingPincode,
    });

    return NextResponse.json(successResponse(quote));
  } catch (error: unknown) {
    const err = error as { message?: string; statusCode?: number };
    const message = err.message || "Failed to calculate quote";
    return NextResponse.json(errorResponse(message, "QUOTE_CALCULATION_ERROR"), {
      status: err.statusCode || 400,
    });
  }
}
