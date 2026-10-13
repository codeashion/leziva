import { NextRequest, NextResponse } from "next/server";
import { addressService } from "@/server/services/address.service";
import { authenticateRequest } from "@/server/auth/guards";
import { successResponse, errorResponse } from "@/utils/api-response";

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json(errorResponse("Authentication required to view saved addresses", "UNAUTHORIZED"), {
        status: 401,
      });
    }

    const addresses = await addressService.getCustomerAddresses(user.id);
    return NextResponse.json(successResponse(addresses));
  } catch (error: unknown) {
    const err = error as { message?: string; statusCode?: number };
    const message = err.message || "Failed to load addresses";
    return NextResponse.json(errorResponse(message, "ADDRESS_FETCH_ERROR"), { status: err.statusCode || 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    const body = await request.json();

    const created = await addressService.createAddress(user?.id || null, body);
    return NextResponse.json(successResponse(created, { message: "Address saved successfully" }), { status: 201 });
  } catch (error: unknown) {
    const err = error as { message?: string; statusCode?: number };
    const message = err.message || "Failed to save address";
    return NextResponse.json(errorResponse(message, "ADDRESS_CREATE_ERROR"), { status: err.statusCode || 400 });
  }
}
