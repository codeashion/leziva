import { NextResponse } from "next/server";
import { checkVelocityServiceability } from "@/lib/velocity";

export async function POST(request: Request) {
  try {
    const { from, to, paymentMode, shipmentType } = await request.json();

    if (!from || !to) {
      return NextResponse.json(
        { success: false, message: "Pickup and destination pincodes are required." },
        { status: 400 }
      );
    }

    const result = await checkVelocityServiceability({
      from: String(from),
      to: String(to),
      paymentMode: paymentMode === "cod" ? "cod" : "prepaid",
      shipmentType: shipmentType === "return" ? "return" : "forward",
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Serviceability check failed";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
