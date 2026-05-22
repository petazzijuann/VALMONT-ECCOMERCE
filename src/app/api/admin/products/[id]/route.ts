import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma/client";

const stockSchema = z.record(z.string(), z.number().min(0));

const putSchema = z.object({
  name:         z.string().min(1),
  description:  z.string().optional().default(""),
  category:     z.enum(["remeras", "pantalones", "buzos", "accesorios", "calzado"]),
  price_sale:   z.number().positive(),
  price_cost:   z.number().positive(),
  stock:        stockSchema,
  tags:         z.array(z.string()),
  is_published: z.boolean(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  if (typeof body.is_published !== "boolean") {
    return NextResponse.json({ error: "is_published requerido" }, { status: 400 });
  }

  const product = await prisma.product.update({
    where: { id },
    data: { is_published: body.is_published },
  });

  return NextResponse.json({ id: product.id, is_published: product.is_published });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = putSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const updated = await prisma.product.update({
    where: { id },
    data: {
      name:         parsed.data.name,
      description:  parsed.data.description,
      category:     parsed.data.category,
      price_sale:   parsed.data.price_sale,
      price_cost:   parsed.data.price_cost,
      stock:        parsed.data.stock as Record<string, number>,
      tags:         parsed.data.tags,
      is_published: parsed.data.is_published,
    },
  });

  return NextResponse.json({ ...updated, price_sale: Number(updated.price_sale), price_cost: Number(updated.price_cost) });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const salesCount = await prisma.sale.count({ where: { product_id: id } });
  if (salesCount > 0) {
    return NextResponse.json(
      { error: "Este producto tiene ventas registradas y no puede eliminarse" },
      { status: 409 }
    );
  }

  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
