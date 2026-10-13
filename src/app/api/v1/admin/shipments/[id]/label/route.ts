import { NextRequest, NextResponse } from "next/server";
import { requireRoles } from "@/server/auth/guards";
import { shipmentRepository } from "@/server/repositories/shipment.repository";
import { velocityConfigService } from "@/server/integrations/velocity/velocity.config";
import { successResponse, errorResponse } from "@/utils/api-response";
import { RoleType } from "@prisma/client";
import { UnauthorizedError, ForbiddenError } from "@/utils/errors";
import { logger } from "@/utils/logger";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await requireRoles(request, [RoleType.SUPER_ADMIN, RoleType.ORDER_MANAGER]);
    const { id } = await params;

    const shipment = await shipmentRepository.findById(id);
    if (!shipment) {
      return NextResponse.json(errorResponse("Shipment not found", "NOT_FOUND"), { status: 404 });
    }

    if (!shipment.labelUrl) {
      return NextResponse.json(
        errorResponse("No shipping label URL available for this shipment.", "NO_LABEL_URL"),
        { status: 404 }
      );
    }

    // SSRF & Security Validation: Verify the URL domain matches trusted Velocity endpoints
    const config = velocityConfigService.getConfig();
    let labelParsedUrl: URL;
    try {
      labelParsedUrl = new URL(shipment.labelUrl);
    } catch {
      return NextResponse.json(
        errorResponse("Corrupted shipping label URL stored.", "INVALID_LABEL_URL"),
        { status: 400 }
      );
    }

    const trustedBase = new URL(config.baseUrl);
    const isDomainAllowed =
      labelParsedUrl.hostname === trustedBase.hostname ||
      labelParsedUrl.hostname.endsWith(".velocity.in") ||
      labelParsedUrl.hostname.includes("velocity");

    if (!isDomainAllowed) {
      logger.error(`[AdminLabel] Untrusted label host rejected: ${labelParsedUrl.hostname}`);
      return NextResponse.json(
        errorResponse("Shipping label URL host failed security verification.", "UNTRUSTED_HOST"),
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode") || "json";

    logger.info(`[AdminLabel] Staff ${adminUser.email} accessed label for shipment ${shipment.id} (AWB: ${shipment.awb})`);

    if (mode === "redirect") {
      return NextResponse.redirect(shipment.labelUrl);
    }

    return NextResponse.json(
      successResponse({
        shipmentId: shipment.id,
        awb: shipment.awb,
        courierName: shipment.courierName,
        labelUrl: shipment.labelUrl,
        manifestUrl: shipment.manifestUrl,
      })
    );
  } catch (error: unknown) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(errorResponse(error.message, "UNAUTHORIZED"), { status: 401 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json(errorResponse(error.message, "FORBIDDEN"), { status: 403 });
    }
    const message = error instanceof Error ? error.message : "Label access failed";
    return NextResponse.json(errorResponse(message, "INTERNAL_ERROR"), { status: 500 });
  }
}
