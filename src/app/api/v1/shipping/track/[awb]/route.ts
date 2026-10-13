import { NextRequest, NextResponse } from "next/server";
import { velocityTrackingService } from "@/server/integrations/velocity/velocity-tracking.service";
import { shipmentRepository } from "@/server/repositories/shipment.repository";
import { successResponse, errorResponse } from "@/utils/api-response";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ awb: string }> }
) {
  try {
    const { awb } = await params;
    if (!awb || typeof awb !== "string" || awb.trim().length < 3) {
      return NextResponse.json(
        errorResponse("Invalid AWB code provided.", "INVALID_AWB"),
        { status: 400 }
      );
    }

    const cleanAwb = awb.trim();
    const trackingInfo = await velocityTrackingService.getTrackingForAwb(cleanAwb);
    const localShipment = await shipmentRepository.findByAwb(cleanAwb);

    if (!trackingInfo && !localShipment) {
      return NextResponse.json(
        errorResponse(`No tracking records found for AWB: ${cleanAwb}`, "AWB_NOT_FOUND"),
        { status: 404 }
      );
    }

    return NextResponse.json(
      successResponse({
        awb: cleanAwb,
        courierName: trackingInfo?.courier_name || localShipment?.courierName || "Velocity Logistics",
        currentStatus: trackingInfo?.current_status || localShipment?.status || "IN_TRANSIT",
        origin: trackingInfo?.origin || "Surat Atelier",
        destination: trackingInfo?.destination || "Destination Hub",
        pickupDate: trackingInfo?.pickup_date || localShipment?.pickupDate || null,
        expectedDeliveryDate: trackingInfo?.expected_delivery_date || null,
        deliveredDate: trackingInfo?.delivered_date || null,
        activities: trackingInfo?.activities || [],
        orderNumber: trackingInfo?.order_id || localShipment?.velocityOrderId || null,
        lastUpdated: localShipment?.lastTrackingRefresh || new Date(),
      })
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Tracking lookup failed";
    return NextResponse.json(
      errorResponse(message, "TRACKING_ERROR"),
      { status: 500 }
    );
  }
}
