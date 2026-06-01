import type { ProductAdmin, ColorVariant, StockMap } from "@/types";

const HEADERS = [
  "Nombre", "Categoría", "Precio Venta", "Precio Costo",
  "Margen %", "Stock Total", "Stock Detalle", "Publicado", "Tags", "Peso kg",
];

export function formatStockDetalle(p: ProductAdmin): string {
  const variants = (p.color_variants ?? []) as ColorVariant[];

  if (variants.length > 0) {
    return variants
      .map((v) => {
        const sizes = Object.entries(v.stock)
          .map(([size, qty]) => `${size}:${qty}`)
          .join(" ");
        return `${v.name} — ${sizes}`;
      })
      .join(" / ");
  }

  const stock = p.stock as StockMap;
  const entries = Object.entries(stock).filter(([, qty]) => qty > 0);
  if (entries.length === 0) return "Sin stock";
  return entries.map(([size, qty]) => `${size}:${qty}`).join(", ");
}

export function buildExportRows(products: ProductAdmin[]): (string | number)[][] {
  return products.map((p) => {
    const variants = (p.color_variants ?? []) as ColorVariant[];
    const totalUnits =
      variants.length > 0
        ? variants.reduce(
            (sum, v) => sum + Object.values(v.stock).reduce((a, q) => a + q, 0),
            0
          )
        : Object.values(p.stock as StockMap).reduce((s, q) => s + q, 0);

    const margin = p.price_sale > 0
      ? Math.round(((p.price_sale - p.price_cost) / p.price_sale) * 100)
      : 0;

    return [
      p.name,
      p.category.charAt(0).toUpperCase() + p.category.slice(1),
      p.price_sale,
      p.price_cost,
      margin,
      totalUnits,
      formatStockDetalle(p),
      p.is_published ? "Sí" : "No",
      p.tags.join(", "),
      p.weight_kg ?? "",
    ];
  });
}

export function downloadCSV(products: ProductAdmin[]): void {
  const rows = buildExportRows(products);
  const BOM = "﻿";
  const allRows = [HEADERS, ...rows].map((row) =>
    row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")
  );
  const blob = new Blob([BOM + allRows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `valmont-productos-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function downloadXLSX(products: ProductAdmin[]): Promise<void> {
  const XLSX = await import("xlsx");
  const rows = buildExportRows(products);
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([HEADERS, ...rows]);
  XLSX.utils.book_append_sheet(wb, ws, "Productos");
  XLSX.writeFile(wb, `valmont-productos-${new Date().toISOString().slice(0, 10)}.xlsx`);
}
