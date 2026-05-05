import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { verifyWebhookSignature } from "@/lib/astropay/client";

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

  const status = data["status"] as string | undefined;
  const orderId = data["merchant_transaction_id"] as string | undefined;
  const paymentId = data["external_id"] as string | undefined;

  if (!orderId) {
    return NextResponse.json({ error: "merchant_transaction_id requerido" }, { status: 400 });
  }

  // Solo procesamos pagos aprobados
  if (status !== "APPROVED" && status !== "approved" && status !== "1") {
    return NextResponse.json({ received: true });
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "payment_confirmed",
      ...(paymentId ? { astropay_payment_id: paymentId } : {}),
    },
  });

  // Crear registros de Sale por cada item
  const items = order.items as unknown as Array<{
    product_id: string;
    name: string;
    size: string;
    qty: number;
    price: number;
  }>;

  for (const item of items) {
    const product = await prisma.product.findUnique({
      where: { id: item.product_id },
      select: { price_cost: true },
    });

    await prisma.sale.create({
      data: {
        product_id:    item.product_id,
        product_name:  item.name,
        size:          item.size,
        quantity:      item.qty,
        sale_price:    item.price,
        cost_price:    product?.price_cost ?? 0,
        channel:       "online",
        payment_method: "astropay",
        order_id:      orderId,
      },
    });
  }

  return NextResponse.json({ received: true });
}
