import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma/client";

const expenseSchema = z.object({
  description: z.string().trim().min(1).max(200),
  amount:      z.number().positive(),
  date:        z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  category:    z.string().trim().max(80).optional().nullable(),
  notes:       z.string().trim().max(500).optional().nullable(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = expenseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;

  try {
    const expense = await prisma.expense.update({
      where: { id },
      data: {
        description: d.description,
        amount:      d.amount,
        date:        new Date(d.date),
        category:    d.category ?? null,
        notes:       d.notes ?? null,
      },
    });
    return NextResponse.json({
      id:          expense.id,
      description: expense.description,
      amount:      Number(expense.amount),
      date:        expense.date.toISOString().slice(0, 10),
      category:    expense.category,
      notes:       expense.notes,
      created_at:  expense.created_at.toISOString(),
      updated_at:  expense.updated_at.toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await prisma.expense.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }
}
