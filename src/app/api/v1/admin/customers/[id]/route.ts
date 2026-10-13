import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/server/auth/guards";
import { Permissions } from "@/server/auth/rbac.service";
import { customerService } from "@/server/services/customer.service";
import { successResponse, errorResponse } from "@/utils/api-response";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requirePermission(request, Permissions.CUSTOMERS_READ);
    const { id } = await params;

    const customer = await customerService.getCustomerById(id);
    return NextResponse.json(successResponse(customer));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load customer";
    return NextResponse.json(errorResponse(message, "CUSTOMER_NOT_FOUND"), { status: 404 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requirePermission(request, Permissions.CUSTOMERS_GDPR_DELETE);
    const { id } = await params;

    const result = await customerService.processDataDeletion(id, user.id);
    return NextResponse.json(successResponse(result));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "GDPR deletion failed";
    return NextResponse.json(errorResponse(message, "GDPR_DELETE_ERROR"), { status: 400 });
  }
}
