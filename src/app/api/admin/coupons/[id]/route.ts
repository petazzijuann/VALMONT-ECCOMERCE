import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma/client";

const couponSchema = z.object({
  code:         z.string().min(1).regex(/^[A-Z0-9]+$/),
  type:         z.enum(["percent", "fixed", "free_shipping"]),
  value:        z.number().positive().optional().nullable(),
  stock:        z.number().int().min(1),
  min_purchase: z.number().positive().optional().nullable(),
  is_active:    z.boolean(),
  expires_at:   z.string().optional().nullable(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = couponSchema.safeParse({ ...body, code: body?.code?.toUpperCase() });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const d = parsed.data;

  const conflict = await prisma.coupon.findFirst({
    where: { code: d.code, NOT: { id } },
  });
  if (conflict) {
    return NextResponse.json({ error: "El código ya existe" }, { status: 409 });
  }

  const coupon = await prisma.coupon.update({
    where: { id },
    data: {
      code:         d.code,
      type:         d.type,
      value:        d.type !== "free_shipping" ? d.value ?? null : null,
      stock:        d.stock,
      min_purchase: d.min_purchase ?? null,
      is_active:    d.is_active,
      expires_at:   d.expires_at ? new Date(d.expires_at) : null,
    },
  });

  return NextResponse.json(coupon);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const coupon = await prisma.coupon.findUnique({ where: { id } });
  if (!coupon) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }
  if (coupon.used_count > 0) {
    return NextResponse.json({ error: "has_uses" }, { status: 409 });
  }

  await prisma.coupon.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
