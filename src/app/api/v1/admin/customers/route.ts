import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/server/auth/guards";
import { Permissions } from "@/server/auth/rbac.service";
import { customerService } from "@/server/services/customer.service";
import { successResponse, errorResponse } from "@/utils/api-response";

export async function GET(request: NextRequest) {
  try {
    await requirePermission(request, Permissions.CUSTOMERS_READ);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const result = await customerService.getCustomers({ search, page, limit });
    return NextResponse.json(successResponse(result, { message: "Customers loaded." }));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load customers";
    return NextResponse.json(errorResponse(message, "CUSTOMERS_ERROR"), { status: 400 });
  }
}
