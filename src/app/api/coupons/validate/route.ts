import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma/client";

const schema = z.object({
  code:     z.string().min(1),
  subtotal: z.number().positive(),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const { code, subtotal } = parsed.data;

  const coupon = await prisma.coupon.findUnique({
    where: { code: code.toUpperCase() },
  });

  if (!coupon) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (!coupon.is_active) {
    return NextResponse.json({ error: "inactive" }, { status: 400 });
  }
  if (coupon.stock <= 0) {
    return NextResponse.json({ error: "out_of_stock" }, { status: 400 });
  }
  if (coupon.expires_at && coupon.expires_at < new Date()) {
    return NextResponse.json({ error: "expired" }, { status: 400 });
  }
  if (coupon.min_purchase && subtotal < Number(coupon.min_purchase)) {
    return NextResponse.json(
      { error: "min_purchase", min: Number(coupon.min_purchase) },
      { status: 400 }
    );
  }

  let discount_amount = 0;
  if (coupon.type === "percent") {
    discount_amount = Math.floor(subtotal * Number(coupon.value) / 100);
  } else if (coupon.type === "fixed") {
    discount_amount = Math.min(Number(coupon.value), subtotal);
  }

  return NextResponse.json({
    code:            coupon.code,
    type:            coupon.type,
    value:           coupon.value !== null ? Number(coupon.value) : null,
    discount_amount,
  });
}
