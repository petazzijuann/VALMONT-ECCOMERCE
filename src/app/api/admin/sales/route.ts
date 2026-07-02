import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";

// Neutraliza inyección de fórmulas al abrir el CSV en Excel/Sheets:
// celdas que empiezan con = + - @ se prefijan con apóstrofo.
function csvSafe(value: string): string {
  return /^[=+\-@]/.test(value) ? `'${value}` : value;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const format = searchParams.get("format");
  const parsedLimit = parseInt(searchParams.get("limit") ?? "100");
  const limit = Number.isFinite(parsedLimit) && parsedLimit > 0
    ? Math.min(parsedLimit, 5000)
    : 100;

  const sales = await prisma.sale.findMany({
    orderBy: { created_at: "desc" },
    take: format === "csv" ? 5000 : limit,
    include: {
      order: {
        select: {
          customer_name:    true,
          customer_email:   true,
          customer_phone:   true,
          customer_address: true,
        },
      },
    },
  });

  const serialized = sales.map((s) => ({
    ...s,
    sale_price:       Number(s.sale_price),
    cost_price:       Number(s.cost_price),
    created_at:       s.created_at.toISOString(),
    customer_name:    s.order?.customer_name    ?? null,
    customer_email:   s.order?.customer_email   ?? null,
    customer_phone:   s.order?.customer_phone   ?? null,
    customer_address: s.order?.customer_address ?? null,
    order: undefined, // no exponer el objeto anidado
  }));

  if (format === "csv") {
    const header = "id,fecha,producto,color,talle,cantidad,precio_venta,precio_costo,canal,pago,cliente,email,telefono";
    const rows = serialized.map((s) =>
      [
        s.id,
        s.created_at.slice(0, 10),
        `"${csvSafe(s.product_name).replace(/"/g, '""')}"`,
        s.color ?? "",
        s.size,
        s.quantity,
        s.sale_price,
        s.cost_price,
        s.channel,
        s.payment_method,
        `"${csvSafe(s.customer_name ?? "").replace(/"/g, '""')}"`,
        `"${csvSafe(s.customer_email ?? "").replace(/"/g, '""')}"`,
        `"${csvSafe(s.customer_phone ?? "").replace(/"/g, '""')}"`,
      ].join(",")
    );
    const csv = [header, ...rows].join("\n");
    const date = new Date().toISOString().slice(0, 10);
    return new NextResponse(csv, {
      headers: {
        "Content-Type":        "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="valmont-ventas-${date}.csv"`,
      },
    });
  }

  return NextResponse.json(serialized);
}
