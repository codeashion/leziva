import { NextRequest, NextResponse } from "next/server";
import { velocityServiceabilityService } from "@/server/integrations/velocity/velocity-serviceability.service";
import { successResponse, errorResponse } from "@/utils/api-response";
import { VelocityPaymentMode, VelocityShipmentType } from "@/server/integrations/velocity/velocity.types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        errorResponse("Invalid request body.", "INVALID_BODY"),
        { status: 400 }
      );
    }

    const targetPincode = body.to || body.destinationPincode;
    const paymentModeInput = (body.payment_mode || body.paymentMode || "prepaid").toString().toLowerCase();
    const shipmentTypeInput = (body.shipment_type || body.shipmentType || "forward").toString().toLowerCase();
    const originPincode = body.from || body.originPincode;

    if (!targetPincode || typeof targetPincode !== "string" || !/^\d{6}$/.test(targetPincode.trim())) {
      return NextResponse.json(
        errorResponse("Valid 6-digit destination PIN code is required.", "INVALID_PINCODE"),
        { status: 400 }
      );
    }

    const destinationPincode = targetPincode.trim();
    const paymentMode: VelocityPaymentMode = paymentModeInput === "cod" ? "cod" : "prepaid";
    const shipmentType: VelocityShipmentType = shipmentTypeInput === "return" ? "return" : "forward";

    const result = await velocityServiceabilityService.checkServiceability({
      from: originPincode || undefined,
      to: destinationPincode,
      payment_mode: paymentMode,
      shipment_type: shipmentType,
    });

    return NextResponse.json(
      successResponse(result, {
        message: result.is_serviceable
          ? "PIN code is serviceable for delivery"
          : "PIN code is currently unserviceable",
      })
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Serviceability check failed";
    return NextResponse.json(
      errorResponse(message, "SERVICEABILITY_ERROR"),
      { status: 500 }
    );
  }
}
