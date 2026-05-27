"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import useSWR from "swr";
import type { SaleRecord } from "@/types";
import { formatARS } from "@/lib/utils";
import DeleteConfirmDialog from "./DeleteConfirmDialog";

interface SaleWithCustomer extends SaleRecord {
  customer_name?:    string | null;
  customer_email?:   string | null;
  customer_phone?:   string | null;
}

const fetcher = (url: string) =>
  fetch(url).then((r) => r.json() as Promise<SaleWithCustomer[]>);

function MarginBadge({ sale, cost }: { sale: number; cost: number }) {
  const m = Math.round(((sale - cost) / sale) * 100);
  const cls =
    m >= 40
      ? "bg-valmont-success/10 text-valmont-success"
      : m >= 20
      ? "bg-yellow-500/10 text-yellow-600"
      : "bg-valmont-error/10 text-valmont-error";
  return <span className={`label-tag text-[10px] px-2 py-0.5 ${cls}`}>{m}%</span>;
}

const HEADERS = [
  "FECHA", "PRODUCTO", "TALLE", "U.",
  "PRECIO", "COSTO", "MARGEN", "CANAL", "PAGO", "CLIENTE", "",
];

export default function SalesTable() {
  const { data: sales, isLoading, mutate } = useSWR<SaleWithCustomer[]>(
    "/api/admin/sales?limit=200",
    fetcher
  );
  const [deleteSale, setDeleteSale] = useState<SaleRecord | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting,   setDeleting]   = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  function showToast(msg: string, type: "ok" | "err") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  function exportCSV() {
    window.open("/api/admin/sales?format=csv", "_blank");
  }

  function openDelete(sale: SaleRecord) {
    setDeleteSale(sale);
    setDeleteOpen(true);
  }

  async function handleDelete() {
    if (!deleteSale) return;
    setDeleting(true);
    const res = await fetch(`/api/admin/sales/${deleteSale.id}`, { method: "DELETE" });
    setDeleting(false);
    setDeleteOpen(false);

    if (res.ok) {
      showToast("Venta eliminada", "ok");
      await mutate();
    } else {
      showToast("No se pudo eliminar", "err");
    }
    setDeleteSale(null);
  }

  const deleteSaleDate = deleteSale
    ? new Date(deleteSale.created_at).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" })
    : "";

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="label-tag text-muted-foreground text-[10px] mb-1">HISTORIAL</p>
          <h1 className="font-bebas text-5xl">VENTAS</h1>
        </div>
        <button
          onClick={exportCSV}
          className="label-tag text-[11px] px-6 py-3 bg-brand-green text-brand-cream hover:bg-green-mid transition-colors shrink-0"
        >
          EXPORTAR CSV
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 text-sm font-medium shadow-lg ${
          toast.type === "ok" ? "bg-valmont-success text-white" : "bg-valmont-error text-white"
        }`}>
          {toast.msg}
        </div>
      )}

      <div className="bg-card border border-border overflow-x-auto">
        <table className="w-full text-sm min-w-[860px]">
          <thead className="border-b border-border">
            <tr>
              {HEADERS.map((h, i) => (
                <th
                  key={i}
                  className="label-tag text-[10px] text-muted-foreground text-left px-4 py-3 whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? [...Array(8)].map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    {HEADERS.map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-muted animate-pulse rounded-none w-16" />
                      </td>
                    ))}
                  </tr>
                ))
              : sales?.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-8 text-center text-muted-foreground text-sm">
                      No hay ventas registradas todavía.
                    </td>
                  </tr>
                )
              : sales?.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors"
                  >
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {new Date(s.created_at).toLocaleDateString("es-AR", {
                        day: "2-digit", month: "2-digit", year: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3 font-medium max-w-[180px] truncate">{s.product_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.size}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.quantity}</td>
                    <td className="px-4 py-3">{formatARS(s.sale_price)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatARS(s.cost_price)}</td>
                    <td className="px-4 py-3">
                      <MarginBadge sale={s.sale_price} cost={s.cost_price} />
                    </td>
                    <td className="px-4 py-3">
                      <span className={`label-tag text-[10px] px-2 py-0.5 ${
                        s.channel === "online"
                          ? "bg-brand-green/10 text-brand-green"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {s.channel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{s.payment_method}</td>
                    <td className="px-4 py-3 max-w-[160px]">
                      {s.customer_name ? (
                        <div>
                          <p className="text-xs truncate">{s.customer_name}</p>
                          {s.customer_email && (
                            <p className="label-tag text-[10px] text-muted-foreground truncate">{s.customer_email}</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openDelete(s)}
                        title="Eliminar venta"
                        className="text-muted-foreground hover:text-valmont-error transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="¿Eliminar esta venta?"
        description={`Se eliminará el registro de venta de "${deleteSale?.product_name}" del ${deleteSaleDate}. Esta acción no restaura el stock.`}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
