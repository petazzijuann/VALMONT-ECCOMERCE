"use client";

import { useState } from "react";
import useSWR from "swr";
import { formatARS } from "@/lib/utils";
import type { OrderItem } from "@/types";
import DeleteConfirmDialog from "./DeleteConfirmDialog";

interface AdminOrder {
  id: string;
  customer_name:    string;
  customer_email:   string;
  customer_phone:   string;
  customer_address: { street: string; city: string; province: string; zip: string };
  items: OrderItem[];
  total_amount: number;
  payment_method: string;
  status: string;
  created_at: string;
  shipping_method:       string | null;
  shipping_cost:         number | null;
  shipping_days_label:   string | null;
  shipping_carrier_name: string | null;
  andreani_tracking_id:  string | null;
  coupon_code:           string | null;
  discount_amount:       number | null;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json() as Promise<AdminOrder[]>);

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  pending_payment:   { label: "PENDIENTE",  cls: "bg-yellow-500/10 text-yellow-600" },
  payment_confirmed: { label: "CONFIRMADO", cls: "bg-valmont-success/10 text-valmont-success" },
  cancelled:         { label: "RECHAZADO",  cls: "bg-valmont-error/10 text-valmont-error" },
  shipped:           { label: "ENVIADO",    cls: "bg-brand-green/10 text-brand-green" },
  delivered:         { label: "ENTREGADO",  cls: "bg-muted text-muted-foreground" },
};

const DELETABLE = ["pending_payment", "cancelled"];

export default function OrdersTable() {
  const { data: orders, isLoading, mutate } = useSWR<AdminOrder[]>("/api/admin/orders", fetcher);
  const [acting,      setActing]      = useState<string | null>(null);
  const [deleteOrder, setDeleteOrder] = useState<AdminOrder | null>(null);
  const [deleteOpen,  setDeleteOpen]  = useState(false);
  const [deleting,    setDeleting]    = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  function showToast(msg: string, type: "ok" | "err") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleAction(id: string, action: "confirm" | "reject") {
    setActing(id + action);
    await fetch(`/api/admin/orders/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ action }),
    });
    await mutate();
    setActing(null);
  }

  function openDelete(order: AdminOrder) {
    setDeleteOrder(order);
    setDeleteOpen(true);
  }

  async function handleDelete() {
    if (!deleteOrder) return;
    setDeleting(true);
    const res = await fetch(`/api/admin/orders/${deleteOrder.id}`, { method: "DELETE" });
    setDeleting(false);
    setDeleteOpen(false);

    if (res.ok) {
      showToast("Pedido eliminado", "ok");
      await mutate();
    } else {
      const data = await res.json().catch(() => ({}));
      showToast(data.error ?? "No se pudo eliminar", "err");
    }
    setDeleteOrder(null);
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="label-tag text-muted-foreground text-[10px] mb-1">GESTIÓN</p>
        <h1 className="font-bebas text-5xl">PEDIDOS</h1>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 text-sm font-medium shadow-lg ${
          toast.type === "ok" ? "bg-valmont-success text-white" : "bg-valmont-error text-white"
        }`}>
          {toast.msg}
        </div>
      )}

      <div className="flex flex-col gap-4">
        {isLoading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="border border-border p-4">
              <div className="h-4 bg-muted animate-pulse w-48 mb-2" />
              <div className="h-4 bg-muted animate-pulse w-32" />
            </div>
          ))
        ) : orders?.length === 0 ? (
          <p className="text-muted-foreground text-sm py-8 text-center">No hay pedidos todavía.</p>
        ) : (
          orders?.map((order) => {
            const status = STATUS_LABEL[order.status] ?? { label: order.status, cls: "bg-muted text-muted-foreground" };
            const isPending = order.status === "pending_payment";
            const isDeletable = DELETABLE.includes(order.status);
            const items = order.items as unknown as OrderItem[];

            return (
              <div key={order.id} className="border border-border p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-medium">{order.customer_name}</span>
                      <span className="text-muted-foreground text-sm">{order.customer_phone}</span>
                      <span className={`label-tag text-[10px] px-2 py-0.5 ${status.cls}`}>
                        {status.label}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-xs">
                      #{order.id.slice(0, 8).toUpperCase()} ·{" "}
                      {new Date(order.created_at).toLocaleDateString("es-AR", {
                        day: "2-digit", month: "2-digit", year: "2-digit",
                        hour: "2-digit", minute: "2-digit",
                      })} · {order.payment_method}
                    </p>
                    <p className="text-muted-foreground text-xs mt-0.5">{order.customer_email}</p>
                    {order.customer_address && (
                      <p className="text-muted-foreground text-xs mt-0.5">
                        {order.customer_address.street}, {order.customer_address.city}, {order.customer_address.province} ({order.customer_address.zip})
                      </p>
                    )}
                  </div>
                  <p className="price-text text-lg shrink-0">{formatARS(order.total_amount)}</p>
                </div>

                <ul className="text-sm text-muted-foreground flex flex-col gap-1">
                  {items.map((item, i) => (
                    <li key={i}>
                      {item.name} ({item.size}) ×{item.qty} — {formatARS(item.price * item.qty)}
                    </li>
                  ))}
                </ul>

                {/* Cupón */}
                {order.coupon_code && (
                  <p className="text-xs text-brand-green label-tag">
                    🏷 {order.coupon_code}
                    {order.discount_amount ? ` (−${formatARS(order.discount_amount)})` : ""}
                  </p>
                )}

                {/* Envío y tracking */}
                {order.shipping_method && (
                  <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 pt-1">
                    <span className="label-tag">
                      {order.shipping_carrier_name ?? order.shipping_method}
                      {order.shipping_days_label ? ` · ${order.shipping_days_label}` : ""}
                      {order.shipping_cost ? ` · ${formatARS(order.shipping_cost)}` : ""}
                    </span>
                    {order.andreani_tracking_id ? (
                      <a
                        href={`https://www.andreani.com/#!/informacionEnvio/${order.andreani_tracking_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-green hover:underline label-tag"
                      >
                        TRACKING: {order.andreani_tracking_id}
                      </a>
                    ) : (
                      <span className="text-muted-foreground/60">Sin tracking aún</span>
                    )}
                  </div>
                )}

                {(isPending || isDeletable) && (
                  <div className="flex flex-wrap gap-3 pt-1">
                    {isPending && (
                      <>
                        <button
                          onClick={() => handleAction(order.id, "confirm")}
                          disabled={!!acting}
                          className="label-tag text-[11px] px-5 py-2 bg-valmont-success text-white hover:opacity-90 transition-opacity disabled:opacity-40"
                        >
                          {acting === order.id + "confirm" ? "..." : "CONFIRMAR PAGO"}
                        </button>
                        <button
                          onClick={() => handleAction(order.id, "reject")}
                          disabled={!!acting}
                          className="label-tag text-[11px] px-5 py-2 border border-valmont-error text-valmont-error hover:bg-valmont-error/10 transition-colors disabled:opacity-40"
                        >
                          {acting === order.id + "reject" ? "..." : "RECHAZAR"}
                        </button>
                      </>
                    )}
                    {isDeletable && (
                      <button
                        onClick={() => openDelete(order)}
                        disabled={!!acting}
                        className="label-tag text-[11px] px-5 py-2 border border-valmont-error/50 text-valmont-error hover:bg-valmont-error/10 transition-colors disabled:opacity-40"
                      >
                        ELIMINAR PEDIDO
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="¿Eliminar pedido?"
        description={`El pedido #${deleteOrder?.id.slice(0, 8).toUpperCase()} de ${deleteOrder?.customer_name} será eliminado. Esta acción no se puede deshacer.`}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
