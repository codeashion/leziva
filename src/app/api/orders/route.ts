import { NextResponse } from "next/server";
import { INITIAL_ORDERS } from "@/lib/constants";

export async function GET() {
  return NextResponse.json({
    success: true,
    orders: INITIAL_ORDERS,
  });
}

export async function POST(request: Request) {
  try {
    const orderData = await request.json();

    const orderNumber = `#${Math.floor(1000 + Math.random() * 9000)}`;
    const createdOrder = {
      ...orderData,
      id: `ord-${Date.now()}`,
      orderNumber,
      createdAt: new Date().toISOString(),
      orderStatus: "Processing",
      paymentStatus: "paid",
    };

    return NextResponse.json({
      success: true,
      order: createdOrder,
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Failed to create order" }, { status: 500 });
  }
}
