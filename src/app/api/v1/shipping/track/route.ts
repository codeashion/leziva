import { NextRequest, NextResponse } from "next/server";
import { velocityTrackingService } from "@/server/integrations/velocity/velocity-tracking.service";
import { shipmentRepository } from "@/server/repositories/shipment.repository";
import { orderRepository } from "@/server/repositories/order.repository";
import { successResponse, errorResponse } from "@/utils/api-response";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const awb = searchParams.get("awb")?.trim();
    const orderNumber = searchParams.get("orderNumber")?.trim();

    if (!awb && !orderNumber) {
      return NextResponse.json(
        errorResponse("Please provide either 'awb' or 'orderNumber' query parameter.", "MISSING_QUERY"),
        { status: 400 }
      );
    }

    let targetAwb = awb;
    let localShipment = null;

    if (!targetAwb && orderNumber) {
      const order = await orderRepository.findByOrderNumber(orderNumber);
      if (order) {
        const shipments = await shipmentRepository.findByOrderId(order.id);
        localShipment = shipments[0] || null;
        if (localShipment?.awb) {
          targetAwb = localShipment.awb;
        }
      }
    }

    if (!targetAwb) {
      if (localShipment) {
        // Shipment created but no AWB yet
        return NextResponse.json(
          successResponse({
            orderNumber: orderNumber || localShipment.velocityOrderId,
            awb: null,
            courierName: localShipment.courierName || "Velocity Logistics",
            currentStatus: localShipment.status,
            origin: "Surat Atelier Hub",
            destination: "Destination",
            activities: [
              {
                date_time: localShipment.createdAt.toISOString(),
                status: "PROCESSING",
                activity: "Order is being prepared and manifested at Surat Atelier Hub",
                location: "Surat Atelier",
              },
            ],
            lastUpdated: localShipment.updatedAt,
          })
        );
      }

      return NextResponse.json(
        errorResponse(`No shipment found matching order '${orderNumber}'`, "NOT_FOUND"),
        { status: 404 }
      );
    }

    const trackingInfo = await velocityTrackingService.getTrackingForAwb(targetAwb);
    if (!localShipment) {
      localShipment = await shipmentRepository.findByAwb(targetAwb);
    }

    return NextResponse.json(
      successResponse({
        orderNumber: trackingInfo?.order_id || localShipment?.velocityOrderId || orderNumber,
        awb: targetAwb,
        courierName: trackingInfo?.courier_name || localShipment?.courierName || "Velocity Logistics",
        currentStatus: trackingInfo?.current_status || localShipment?.status || "IN_TRANSIT",
        origin: trackingInfo?.origin || "Surat Atelier Hub",
        destination: trackingInfo?.destination || "Destination Delivery Hub",
        pickupDate: trackingInfo?.pickup_date || localShipment?.pickupDate || null,
        expectedDeliveryDate: trackingInfo?.expected_delivery_date || null,
        deliveredDate: trackingInfo?.delivered_date || null,
        activities: trackingInfo?.activities && trackingInfo.activities.length > 0
          ? trackingInfo.activities
          : [
              {
                date_time: (localShipment?.createdAt || new Date()).toISOString(),
                status: "MANIFESTED",
                activity: "AWB Generated and carrier assigned via Velocity Shipping API",
                location: "Surat Atelier Hub",
              },
            ],
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
