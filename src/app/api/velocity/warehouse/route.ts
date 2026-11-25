import { NextResponse } from "next/server";
import { createVelocityWarehouse, getVelocityEnvStatus } from "@/lib/velocity";

export async function GET() {
  return NextResponse.json({
    success: true,
    ...getVelocityEnvStatus(),
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      phoneNumber,
      email,
      contactPerson,
      gstNo,
      streetAddress,
      zip,
      city,
      state,
    } = body;

    if (
      !name ||
      !phoneNumber ||
      !email ||
      !contactPerson ||
      !streetAddress ||
      !zip ||
      !city ||
      !state
    ) {
      return NextResponse.json(
        { success: false, message: "All required warehouse address fields must be provided." },
        { status: 400 }
      );
    }

    const result = await createVelocityWarehouse({
      name,
      phoneNumber,
      email,
      contactPerson,
      gstNo,
      streetAddress,
      zip,
      city,
      state,
    });

    return NextResponse.json({
      success: true,
      warehouseId: result.warehouseId,
      pickupLocation: result.pickupLocation,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create Velocity warehouse";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
