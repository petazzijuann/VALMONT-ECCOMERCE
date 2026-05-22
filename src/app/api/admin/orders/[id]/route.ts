import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma/client";
import { fulfillOrder, releaseStock } from "@/lib/orders/fulfill";

const schema = z.object({
  action: z.enum(["confirm", "reject"]),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "action debe ser 'confirm' o 'reject'" }, { status: 400 });
  }

  if (parsed.data.action === "confirm") {
    await fulfillOrder(id, "transfer");
  } else {
    await releaseStock(id);
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const deletable = ["pending_payment", "cancelled"];
  if (!deletable.includes(order.status)) {
    return NextResponse.json(
      { error: "Solo se pueden eliminar pedidos pendientes o cancelados" },
      { status: 409 }
    );
  }

  if (order.status === "pending_payment") {
    await releaseStock(id);
  }

  await prisma.order.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
