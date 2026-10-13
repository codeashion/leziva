import { NextRequest, NextResponse } from "next/server";
import { addressService } from "@/server/services/address.service";
import { authenticateRequest } from "@/server/auth/guards";
import { successResponse, errorResponse } from "@/utils/api-response";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json(errorResponse("Authentication required", "UNAUTHORIZED"), { status: 401 });
    }

    const address = await addressService.getAddressById(id, user.id);
    return NextResponse.json(successResponse(address));
  } catch (error: unknown) {
    const err = error as { message?: string; statusCode?: number };
    const message = err.message || "Address not found";
    return NextResponse.json(errorResponse(message, "ADDRESS_NOT_FOUND"), { status: err.statusCode || 404 });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json(errorResponse("Authentication required", "UNAUTHORIZED"), { status: 401 });
    }

    const body = await request.json();
    const updated = await addressService.updateAddress(id, user.id, body);
    return NextResponse.json(successResponse(updated, { message: "Address updated successfully" }));
  } catch (error: unknown) {
    const err = error as { message?: string; statusCode?: number };
    const message = err.message || "Failed to update address";
    return NextResponse.json(errorResponse(message, "ADDRESS_UPDATE_ERROR"), { status: err.statusCode || 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json(errorResponse("Authentication required", "UNAUTHORIZED"), { status: 401 });
    }

    await addressService.deleteAddress(id, user.id);
    return NextResponse.json(successResponse({ success: true }, { message: "Address deleted successfully" }));
  } catch (error: unknown) {
    const err = error as { message?: string; statusCode?: number };
    const message = err.message || "Failed to delete address";
    return NextResponse.json(errorResponse(message, "ADDRESS_DELETE_ERROR"), { status: err.statusCode || 400 });
  }
}
