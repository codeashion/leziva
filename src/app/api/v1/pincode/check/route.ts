import { NextRequest, NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/utils/api-response";
import { velocityServiceabilityService } from "@/server/integrations/velocity/velocity-serviceability.service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const pincode = searchParams.get("pincode")?.trim();

  if (!pincode || !/^\d{6}$/.test(pincode)) {
    return NextResponse.json(
      errorResponse("Please enter a valid 6-digit Indian PIN code.", "INVALID_PINCODE"),
      { status: 400 }
    );
  }

  try {
    const serviceability = await velocityServiceabilityService.checkServiceability({
      to: pincode,
      payment_mode: "prepaid",
      shipment_type: "forward",
    });

    const couriers = serviceability.couriers || [];
    const minDays = couriers.length > 0
      ? Math.min(...couriers.map((c) => c.estimated_delivery_days || 3))
      : 3;
    const maxDays = minDays + 2;

    const codAvailable = couriers.some((c) => c.cod_available !== false);
    const courierName = couriers[0]?.courier_name || "Velocity Express Logistics";

    return NextResponse.json(
      successResponse({
        pincode,
        serviceable: serviceability.is_serviceable,
        estimatedDelivery: `${minDays} - ${maxDays} business days`,
        codAvailable,
        expressAvailable: true,
        shippingCarrier: courierName,
        shippingFee: 0, // Atelier complimentary delivery
        couriers: couriers.map((c) => ({
          name: c.courier_name,
          estimatedDays: c.estimated_delivery_days,
          codAvailable: c.cod_available,
        })),
      })
    );
  } catch (err: unknown) {
    // Fallback gracefully if serviceability lookup has an unexpected exception
    const message = err instanceof Error ? err.message : "Serviceability check failed";
    return NextResponse.json(
      errorResponse(message, "SERVICEABILITY_LOOKUP_FAILED"),
      { status: 500 }
    );
  }
}
