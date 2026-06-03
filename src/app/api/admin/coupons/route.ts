import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma/client";

const couponSchema = z.object({
  code:         z.string().min(1).regex(/^[A-Z0-9]+$/, "Solo letras y números"),
  type:         z.enum(["percent", "fixed", "free_shipping"]),
  value:        z.number().positive().optional().nullable(),
  stock:        z.number().int().min(1),
  min_purchase: z.number().positive().optional().nullable(),
  is_active:    z.boolean().default(true),
  expires_at:   z.string().optional().nullable(),
}).refine((d) => {
  if (d.type === "free_shipping") return true;
  if (d.type === "percent") return d.value !== undefined && d.value !== null && d.value >= 1 && d.value <= 100;
  if (d.type === "fixed")   return d.value !== undefined && d.value !== null && d.value > 0;
  return true;
}, { message: "Valor requerido y válido para el tipo elegido", path: ["value"] });

export async function GET() {
  const coupons = await prisma.coupon.findMany({ orderBy: { created_at: "desc" } });
  return NextResponse.json(coupons.map((c) => ({
    ...c,
    value:        c.value        !== null ? Number(c.value)        : null,
    min_purchase: c.min_purchase !== null ? Number(c.min_purchase) : null,
    expires_at:   c.expires_at   ? c.expires_at.toISOString() : null,
    created_at:   c.created_at.toISOString(),
    updated_at:   c.updated_at.toISOString(),
  })));
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = couponSchema.safeParse({ ...body, code: body?.code?.toUpperCase() });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const d = parsed.data;

  const existing = await prisma.coupon.findUnique({ where: { code: d.code } });
  if (existing) {
    return NextResponse.json({ error: "El código ya existe" }, { status: 409 });
  }

  const coupon = await prisma.coupon.create({
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

  return NextResponse.json(coupon, { status: 201 });
}
