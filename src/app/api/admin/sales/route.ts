import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const format = searchParams.get("format");
  const limit  = parseInt(searchParams.get("limit") ?? "100");

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
    const header = "id,fecha,producto,talle,cantidad,precio_venta,precio_costo,canal,pago,cliente,email,telefono";
    const rows = serialized.map((s) =>
      [
        s.id,
        s.created_at.slice(0, 10),
        `"${s.product_name.replace(/"/g, '""')}"`,
        s.size,
        s.quantity,
        s.sale_price,
        s.cost_price,
        s.channel,
        s.payment_method,
        `"${(s.customer_name ?? "").replace(/"/g, '""')}"`,
        s.customer_email ?? "",
        s.customer_phone ?? "",
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
