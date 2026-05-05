import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const order = await prisma.order.findUnique({ where: { id } });

  if (!order) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  return NextResponse.json({
    id:               order.id,
    customer_name:    order.customer_name,
    customer_email:   order.customer_email,
    customer_phone:   order.customer_phone,
    customer_address: order.customer_address,
    items:            order.items,
    total_amount:     Number(order.total_amount),
    status:           order.status,
    payment_method:   order.payment_method,
    created_at:       order.created_at.toISOString(),
    updated_at:       order.updated_at.toISOString(),
  });
}
