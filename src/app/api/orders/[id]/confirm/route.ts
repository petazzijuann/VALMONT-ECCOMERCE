import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma/client";
import { fulfillOrder } from "@/lib/orders/fulfill";

const schema = z.object({
  payment_proof_url: z.string().url(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  await prisma.order.update({
    where: { id },
    data: { payment_proof_url: parsed.data.payment_proof_url },
  });

  await fulfillOrder(id, "transfer");

  return NextResponse.json({ ok: true });
}
