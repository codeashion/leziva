import { NextRequest, NextResponse } from "next/server";
import { wishlistService } from "@/server/services/wishlist.service";
import {
  authenticateRequest,
  getGuestWishlistIdFromRequest,
  GUEST_WISHLIST_COOKIE_NAME,
} from "@/server/auth/guards";
import { successResponse, errorResponse } from "@/utils/api-response";
import { BadRequestError, NotFoundError } from "@/utils/errors";
import crypto from "crypto";

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    let guestWishlistId = getGuestWishlistIdFromRequest(request);
    let shouldSetGuestCookie = false;

    if (user && guestWishlistId) {
      const merged = await wishlistService.mergeGuestWishlist(user.id, guestWishlistId);
      const res = NextResponse.json(successResponse(merged, { count: merged.length }));
      res.cookies.set({
        name: GUEST_WISHLIST_COOKIE_NAME,
        value: "",
        path: "/",
        expires: new Date(0),
      });
      return res;
    }

    if (!user && !guestWishlistId) {
      guestWishlistId = `gwsh_${crypto.randomUUID()}`;
      shouldSetGuestCookie = true;
    }

    const items = await wishlistService.getWishlist({
      userId: user?.id,
      guestWishlistId: user ? undefined : guestWishlistId,
    });

    const res = NextResponse.json(successResponse(items, { count: items.length }));
    if (shouldSetGuestCookie && guestWishlistId) {
      res.cookies.set({
        name: GUEST_WISHLIST_COOKIE_NAME,
        value: guestWishlistId,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 30 * 24 * 60 * 60,
      });
    }

    return res;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load wishlist";
    return NextResponse.json(errorResponse(message, "WISHLIST_FETCH_ERROR"), {
      status: 500,
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    let guestWishlistId = getGuestWishlistIdFromRequest(request);
    let shouldSetGuestCookie = false;

    if (!user && !guestWishlistId) {
      guestWishlistId = `gwsh_${crypto.randomUUID()}`;
      shouldSetGuestCookie = true;
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        errorResponse("Invalid request body. Expected JSON object.", "INVALID_BODY"),
        { status: 400 }
      );
    }

    const { productId, variantId } = body;
    if (!productId || typeof productId !== "string") {
      return NextResponse.json(
        errorResponse("productId is required.", "INVALID_PRODUCT_ID"),
        { status: 400 }
      );
    }

    const updatedWishlist = await wishlistService.addToWishlist(
      productId,
      {
        userId: user?.id,
        guestWishlistId: user ? undefined : guestWishlistId,
      },
      variantId
    );

    const res = NextResponse.json(
      successResponse(updatedWishlist, {
        message: "Product added to wishlist.",
        count: updatedWishlist.length,
      })
    );

    if (shouldSetGuestCookie && guestWishlistId) {
      res.cookies.set({
        name: GUEST_WISHLIST_COOKIE_NAME,
        value: guestWishlistId,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 30 * 24 * 60 * 60,
      });
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
    const message = error instanceof Error ? error.message : "Failed to add to wishlist";
    return NextResponse.json(errorResponse(message, "WISHLIST_ADD_ERROR"), {
      status: 500,
    });
  }
}
