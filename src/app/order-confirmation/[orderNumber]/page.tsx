import React, { Suspense } from "react";
import { OrderConfirmationClient } from "./order-confirmation-client";
import { Loader2 } from "lucide-react";

interface OrderConfirmationPageProps {
  params: Promise<{ orderNumber: string }>;
}

async function OrderConfirmationContent({ params }: OrderConfirmationPageProps) {
  const { orderNumber } = await params;
  return <OrderConfirmationClient orderNumber={orderNumber} />;
}

export default function OrderConfirmationPage({ params }: OrderConfirmationPageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-8 h-8 text-[#226192] animate-spin" />
          <p className="font-serif text-[#5A6065] text-sm">Retrieving your order invoice...</p>
        </div>
      }
    >
      <OrderConfirmationContent params={params} />
    </Suspense>
  );
}
