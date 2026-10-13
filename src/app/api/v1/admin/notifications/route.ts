import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/server/auth/guards";
import { Permissions } from "@/server/auth/rbac.service";
import { notificationTemplateService } from "@/server/services/notification-template.service";

export async function GET(req: NextRequest) {
  try {
    await requirePermission(req, Permissions.NOTIFICATIONS_READ);
    const templates = await notificationTemplateService.getTemplates();
    return NextResponse.json({ success: true, data: templates });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load notification templates";
    return NextResponse.json({ success: false, error: { message } }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requirePermission(req, Permissions.NOTIFICATIONS_MANAGE);
    const body = await req.json();
    const updated = await notificationTemplateService.saveTemplate(body, user.id);
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save template";
    return NextResponse.json({ success: false, error: { message } }, { status: 500 });
  }
}
