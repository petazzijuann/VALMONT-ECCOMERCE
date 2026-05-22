import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { verifyWebhookSignature } from "@/lib/astropay/client";
import { fulfillOrder } from "@/lib/orders/fulfill";

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const signature = request.headers.get("x-signature") ?? "";

  if (!verifyWebhookSignature(payload, signature)) {
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  let data: Record<string, unknown>;
  try {
    data = JSON.parse(payload);
  } catch {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  const status    = data["status"] as string | undefined;
  const orderId   = data["merchant_transaction_id"] as string | undefined;
  const paymentId = data["external_id"] as string | undefined;

  if (!orderId) {
    return NextResponse.json({ error: "merchant_transaction_id requerido" }, { status: 400 });
  }

  if (status !== "APPROVED" && status !== "approved" && status !== "1") {
    return NextResponse.json({ received: true });
  }

  if (paymentId) {
    await prisma.order.update({
      where: { id: orderId },
      data: { astropay_payment_id: paymentId },
    });
  }

  await fulfillOrder(orderId, "astropay");

  return NextResponse.json({ received: true });
}
