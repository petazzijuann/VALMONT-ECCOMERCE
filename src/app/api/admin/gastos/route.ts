import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma/client";

const expenseSchema = z.object({
  description: z.string().trim().min(1, "La descripción es requerida").max(200),
  amount:      z.number().positive("El monto debe ser mayor a 0"),
  date:        z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
  category:    z.string().trim().max(80).optional().nullable(),
  notes:       z.string().trim().max(500).optional().nullable(),
});

export async function GET() {
  const expenses = await prisma.expense.findMany({ orderBy: { date: "desc" } });
  return NextResponse.json(
    expenses.map((e) => ({
      id:          e.id,
      description: e.description,
      amount:      Number(e.amount),
      date:        e.date.toISOString().slice(0, 10),
      category:    e.category,
      notes:       e.notes,
      created_at:  e.created_at.toISOString(),
      updated_at:  e.updated_at.toISOString(),
    }))
  );
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = expenseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;

  const expense = await prisma.expense.create({
    data: {
      description: d.description,
      amount:      d.amount,
      date:        new Date(d.date),
      category:    d.category ?? null,
      notes:       d.notes ?? null,
    },
  });

  return NextResponse.json(
    {
      id:          expense.id,
      description: expense.description,
      amount:      Number(expense.amount),
      date:        expense.date.toISOString().slice(0, 10),
      category:    expense.category,
      notes:       expense.notes,
      created_at:  expense.created_at.toISOString(),
      updated_at:  expense.updated_at.toISOString(),
    },
    { status: 201 }
  );
}
