import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma/client";
import { createPaymentLink } from "@/lib/astropay/client";
import { reserveStock } from "@/lib/orders/fulfill";
import type { CreateOrderResponse } from "@/types";

const orderSchema = z.object({
  customer_name:    z.string().min(2),
  customer_email:   z.string().email(),
  customer_phone:   z.string().min(6),
  customer_address: z.object({
    street:   z.string().min(3),
    city:     z.string().min(2),
    province: z.string().min(2),
    zip:      z.string().min(4),
  }),
  items: z.array(z.object({
    product_id: z.string(),
    slug:       z.string(),
    name:       z.string(),
    size:       z.string(),
    color:      z.string().nullable().optional(),
    qty:        z.number().int().positive(),
    price:      z.number().positive(),
  })).min(1),
  payment_method: z.enum(["astropay", "transfer"]),

  // Envío (opcionales)
  shipping_method:      z.string().nullable().optional(),
  shipping_cost:        z.number().nullable().optional(),
  shipping_cp:          z.string().nullable().optional(),
  shipping_days_label:  z.string().nullable().optional(),
  shipping_carrier:     z.string().nullable().optional(),
  shipping_carrier_name: z.string().nullable().optional(),
  shipping_service_id:  z.string().nullable().optional(),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = orderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data          = parsed.data;
  const subtotal      = data.items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const shippingCost  = data.shipping_cost ?? 0;
  const total         = subtotal + shippingCost;

  const order = await prisma.order.create({
    data: {
      customer_name:    data.customer_name,
      customer_email:   data.customer_email,
      customer_phone:   data.customer_phone,
      customer_address: data.customer_address,
      items:            data.items,
      total_amount:     total,
      payment_method:   data.payment_method,
      status:           "pending_payment",

      shipping_method:      data.shipping_method      ?? null,
      shipping_cost:        shippingCost > 0 ? shippingCost : null,
      shipping_cp:          data.shipping_cp          ?? null,
      shipping_days_label:  data.shipping_days_label  ?? null,
      shipping_carrier:     data.shipping_carrier     ?? null,
      shipping_carrier_name: data.shipping_carrier_name ?? null,
      shipping_service_id:  data.shipping_service_id  ?? null,
    },
  });

  await reserveStock(order.id);

  const response: CreateOrderResponse = {
    order_id:       order.id,
    total_amount:   total,
    payment_method: data.payment_method,
  };

  if (data.payment_method === "transfer") {
    response.transfer_info = {
      cbu:     process.env.CBU ?? "",
      alias:   process.env.ALIAS_CBU ?? "",
      titular: process.env.TITULAR_CUENTA ?? "",
      amount:  total,
    };
    return NextResponse.json(response, { status: 201 });
  }

  // AstroPay
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  try {
    const { paymentUrl, paymentId } = await createPaymentLink({
      orderId:       order.id,
      amount:        total,
      customerEmail: data.customer_email,
      description:   `VALMONT Pedido #${order.id.slice(0, 8).toUpperCase()}`,
      redirectUrl:   `${baseUrl}/pedido/${order.id}`,
      callbackUrl:   `${baseUrl}/api/webhooks/astropay`,
    });

    await prisma.order.update({
      where: { id: order.id },
      data:  { astropay_payment_id: paymentId },
    });

    response.payment_url = paymentUrl;
  } catch (err) {
    console.error("AstroPay error:", err);
    response.payment_url = `${baseUrl}/pedido/${order.id}`;
  }

  return NextResponse.json(response, { status: 201 });
}
