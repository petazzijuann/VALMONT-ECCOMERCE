"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import useSWR from "swr";
import type { ProductAdmin, StockMap, ColorVariant } from "@/types";
import { formatARS, calculateMargin } from "@/lib/utils";
import DeleteConfirmDialog from "./DeleteConfirmDialog";
import EditProductSheet from "./EditProductSheet";

const fetcher = (url: string) =>
  fetch(url).then((r) => r.json() as Promise<ProductAdmin[]>);

function MarginBadge({ value }: { value: number }) {
  const cls =
    value >= 40
      ? "bg-valmont-success/10 text-valmont-success"
      : value >= 20
      ? "bg-yellow-500/10 text-yellow-600"
      : "bg-valmont-error/10 text-valmont-error";
  return (
    <span className={`label-tag text-[10px] px-2 py-0.5 ${cls}`}>{value}%</span>
  );
}

const HEADERS = ["NOMBRE", "CATEGORÍA", "VENTA", "COSTO", "MARGEN", "STOCK", "ESTADO", ""];

export default function ProductsTable() {
  const { data: products, isLoading, mutate } = useSWR<ProductAdmin[]>(
    "/api/admin/products",
    fetcher
  );
  const [toggling,    setToggling]    = useState<string | null>(null);
  const [editProduct, setEditProduct] = useState<ProductAdmin | null>(null);
  const [editOpen,    setEditOpen]    = useState(false);
  const [deleteProduct, setDeleteProduct] = useState<ProductAdmin | null>(null);
  const [deleteOpen,    setDeleteOpen]    = useState(false);
  const [deleting,      setDeleting]      = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  function showToast(msg: string, type: "ok" | "err") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function togglePublished(id: string, current: boolean) {
    setToggling(id);
    await fetch(`/api/admin/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_published: !current }),
    });
    await mutate();
    setToggling(null);
  }

  function openEdit(p: ProductAdmin) {
    setEditProduct(p);
    setEditOpen(true);
  }

  function openDelete(p: ProductAdmin) {
    setDeleteProduct(p);
    setDeleteOpen(true);
  }

  async function handleDelete() {
    if (!deleteProduct) return;
    setDeleting(true);
    const res = await fetch(`/api/admin/products/${deleteProduct.id}`, { method: "DELETE" });
    setDeleting(false);
    setDeleteOpen(false);

    if (res.ok) {
      showToast("Producto eliminado", "ok");
      await mutate();
    } else {
      const data = await res.json().catch(() => ({}));
      showToast(data.error ?? "No se pudo eliminar", "err");
    }
    setDeleteProduct(null);
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="label-tag text-muted-foreground text-[10px] mb-1">GESTIÓN</p>
        <h1 className="font-bebas text-5xl">PRODUCTOS</h1>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 text-sm font-medium shadow-lg ${
            toast.type === "ok"
              ? "bg-valmont-success text-white"
              : "bg-valmont-error text-white"
          }`}
        >
          {toast.msg}
        </div>
      )}

      <div className="bg-card border border-border overflow-x-auto">
        <table className="w-full text-sm min-w-[760px]">
          <thead className="border-b border-border">
            <tr>
              {HEADERS.map((h) => (
                <th
                  key={h}
                  className="label-tag text-[10px] text-muted-foreground text-left px-4 py-3"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? [...Array(6)].map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    {HEADERS.slice(0, -1).map((h) => (
                      <td key={h} className="px-4 py-3">
                        <div className="h-4 bg-muted animate-pulse w-20" />
                      </td>
                    ))}
                    <td className="px-4 py-3" />
                  </tr>
                ))
              : products?.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground text-sm">
                      No hay productos cargados todavía.
                    </td>
                  </tr>
                )
              : products?.map((p) => {
                  const variants = (p.color_variants ?? []) as ColorVariant[];
                  const totalUnits = variants.length > 0
                    ? variants.reduce((sum, v) => sum + Object.values(v.stock).reduce((a, q) => a + q, 0), 0)
                    : Object.values(p.stock as StockMap).reduce((s, q) => s + q, 0);
                  const margin = calculateMargin(p.price_sale, p.price_cost);
                  return (
                    <tr
                      key={p.id}
                      className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium max-w-[180px] truncate">{p.name}</td>
                      <td className="px-4 py-3 text-muted-foreground capitalize">{p.category}</td>
                      <td className="px-4 py-3">{formatARS(p.price_sale)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatARS(p.price_cost)}</td>
                      <td className="px-4 py-3"><MarginBadge value={margin} /></td>
                      <td className="px-4 py-3 text-muted-foreground">{totalUnits} u.</td>
                      <td className="px-4 py-3">
                        <span className={`label-tag text-[10px] px-2 py-0.5 ${
                          p.is_published
                            ? "bg-valmont-success/10 text-valmont-success"
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {p.is_published ? "PUBLICADO" : "BORRADOR"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* EDITAR */}
                          <button
                            onClick={() => openEdit(p)}
                            className="label-tag text-[10px] px-3 py-1 border border-brand-green text-brand-green hover:bg-brand-green/10 transition-colors flex items-center gap-1"
                          >
                            <Pencil size={11} /> EDITAR
                          </button>
                          {/* PUBLICAR / DESPUBLICAR */}
                          <button
                            onClick={() => togglePublished(p.id, p.is_published)}
                            disabled={toggling === p.id}
                            className={`label-tag text-[10px] px-3 py-1 border transition-colors disabled:opacity-50 ${
                              p.is_published
                                ? "border-valmont-error text-valmont-error hover:bg-valmont-error/10"
                                : "border-valmont-success text-valmont-success hover:bg-valmont-success/10"
                            }`}
                          >
                            {toggling === p.id ? "..." : p.is_published ? "DESPUBLICAR" : "PUBLICAR"}
                          </button>
                          {/* ELIMINAR */}
                          <button
                            onClick={() => openDelete(p)}
                            className="label-tag text-[10px] px-3 py-1 border border-valmont-error text-valmont-error hover:bg-valmont-error/10 transition-colors flex items-center gap-1"
                          >
                            <Trash2 size={11} /> ELIMINAR
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>

      {/* Edit Sheet */}
      <EditProductSheet
        product={editProduct}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaved={async () => {
          showToast("Producto actualizado", "ok");
          await mutate();
        }}
      />

      {/* Delete Dialog */}
      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="¿Eliminar producto?"
        description={`Esta acción no se puede deshacer. El producto "${deleteProduct?.name}" será eliminado permanentemente.`}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
