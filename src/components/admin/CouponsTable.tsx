"use client";

import { useState } from "react";
import { Pencil, Trash2, Plus, X } from "lucide-react";
import useSWR from "swr";
import type { CouponPublic } from "@/types";
import { formatARS } from "@/lib/utils";
import DeleteConfirmDialog from "./DeleteConfirmDialog";

const fetcher = (url: string) => fetch(url).then((r) => r.json() as Promise<CouponPublic[]>);

type CouponType = "percent" | "fixed" | "free_shipping";

interface FormState {
  code: string;
  type: CouponType;
  value: string;
  stock: string;
  min_purchase: string;
  is_active: boolean;
  expires_at: string;
}

const EMPTY_FORM: FormState = {
  code: "", type: "percent", value: "", stock: "",
  min_purchase: "", is_active: true, expires_at: "",
};

function couponStatus(c: CouponPublic): { label: string; dot: string } {
  const now = new Date();
  if (c.stock === 0)                              return { label: "Agotado",  dot: "text-valmont-error" };
  if (c.expires_at && new Date(c.expires_at) < now) return { label: "Vencido",  dot: "text-yellow-600" };
  if (!c.is_active)                               return { label: "Inactivo", dot: "text-muted-foreground" };
  return { label: "Activo", dot: "text-valmont-success" };
}

function describeDiscount(c: CouponPublic): string {
  if (c.type === "percent")       return `${c.value}%`;
  if (c.type === "fixed")         return formatARS(c.value ?? 0);
  return "Envío gratis";
}

function describeType(c: CouponPublic): string {
  if (c.type === "percent") return "%";
  if (c.type === "fixed")   return "$";
  return "Envío";
}

const HEADERS = ["CÓDIGO", "TIPO", "DESCUENTO", "STOCK", "USOS", "VENCIMIENTO", "ESTADO", ""];

export default function CouponsTable() {
  const { data: coupons, isLoading, mutate } = useSWR<CouponPublic[]>("/api/admin/coupons", fetcher);

  const [sheetOpen,   setSheetOpen]   = useState(false);
  const [editId,      setEditId]      = useState<string | null>(null);
  const [form,        setForm]        = useState<FormState>(EMPTY_FORM);
  const [saving,      setSaving]      = useState(false);
  const [formError,   setFormError]   = useState("");

  const [deleteC,     setDeleteC]     = useState<CouponPublic | null>(null);
  const [deleteOpen,  setDeleteOpen]  = useState(false);
  const [deleting,    setDeleting]    = useState(false);

  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  function showToast(msg: string, type: "ok" | "err") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  function openNew() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setSheetOpen(true);
  }

  function openEdit(c: CouponPublic) {
    setEditId(c.id);
    setForm({
      code:         c.code,
      type:         c.type,
      value:        c.value !== null ? String(c.value) : "",
      stock:        String(c.stock),
      min_purchase: c.min_purchase !== null ? String(c.min_purchase) : "",
      is_active:    c.is_active,
      expires_at:   c.expires_at ? c.expires_at.slice(0, 10) : "",
    });
    setFormError("");
    setSheetOpen(true);
  }

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave() {
    setFormError("");
    if (!form.code) { setFormError("El código es requerido"); return; }
    if (!form.stock || parseInt(form.stock) < 1) { setFormError("El stock debe ser ≥ 1"); return; }
    if (form.type !== "free_shipping" && (!form.value || parseFloat(form.value) <= 0)) {
      setFormError("El valor debe ser positivo"); return;
    }
    if (form.type === "percent" && parseFloat(form.value) > 100) {
      setFormError("El porcentaje no puede superar 100"); return;
    }

    setSaving(true);
    const body = {
      code:         form.code.toUpperCase(),
      type:         form.type,
      value:        form.type !== "free_shipping" ? parseFloat(form.value) : null,
      stock:        parseInt(form.stock),
      min_purchase: form.min_purchase ? parseFloat(form.min_purchase) : null,
      is_active:    form.is_active,
      expires_at:   form.expires_at || null,
    };

    const url    = editId ? `/api/admin/coupons/${editId}` : "/api/admin/coupons";
    const method = editId ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    });
    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setFormError(data.error ?? "Error al guardar");
      return;
    }

    setSheetOpen(false);
    showToast(editId ? "Cupón actualizado" : "Cupón creado", "ok");
    await mutate();
  }

  function openDelete(c: CouponPublic) {
    setDeleteC(c);
    setDeleteOpen(true);
  }

  async function handleDelete() {
    if (!deleteC) return;
    setDeleting(true);
    const res = await fetch(`/api/admin/coupons/${deleteC.id}`, { method: "DELETE" });
    setDeleting(false);
    setDeleteOpen(false);

    if (res.ok) {
      showToast("Cupón eliminado", "ok");
      await mutate();
    } else {
      const data = await res.json().catch(() => ({}));
      showToast(
        data.error === "has_uses"
          ? "Este cupón fue utilizado en pedidos y no puede eliminarse"
          : "No se pudo eliminar",
        "err"
      );
    }
    setDeleteC(null);
  }

  const inputClass = "w-full border border-border px-3 py-2 text-sm focus:outline-none focus:border-brand-green bg-background transition-colors";
  const labelClass = "label-tag text-[10px] block mb-1.5 text-muted-foreground";

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="label-tag text-muted-foreground text-[10px] mb-1">GESTIÓN</p>
          <h1 className="font-bebas text-5xl">CUPONES</h1>
        </div>
        <button
          onClick={openNew}
          className="label-tag text-[11px] px-5 py-3 bg-brand-green text-brand-cream hover:bg-green-mid transition-colors flex items-center gap-2 shrink-0"
        >
          <Plus size={13} /> NUEVO CUPÓN
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
        <table className="w-full text-sm min-w-[760px]">
          <thead className="border-b border-border">
            <tr>
              {HEADERS.map((h) => (
                <th key={h} className="label-tag text-[10px] text-muted-foreground text-left px-4 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? [...Array(4)].map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    {HEADERS.map((h) => (
                      <td key={h} className="px-4 py-3">
                        <div className="h-4 bg-muted animate-pulse w-16" />
                      </td>
                    ))}
                  </tr>
                ))
              : coupons?.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground text-sm">
                      No hay cupones todavía.
                    </td>
                  </tr>
                )
              : coupons?.map((c) => {
                  const status = couponStatus(c);
                  return (
                    <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
                      <td className="px-4 py-3 font-medium font-mono">{c.code}</td>
                      <td className="px-4 py-3 text-muted-foreground">{describeType(c)}</td>
                      <td className="px-4 py-3">{describeDiscount(c)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{c.stock}</td>
                      <td className="px-4 py-3 text-muted-foreground">{c.used_count}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {c.expires_at
                          ? new Date(c.expires_at).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })
                          : "Sin venc."}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`label-tag text-[10px] flex items-center gap-1 ${status.dot}`}>
                          <span className="text-base leading-none">●</span>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEdit(c)} className="text-muted-foreground hover:text-foreground transition-colors">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => openDelete(c)} className="text-muted-foreground hover:text-valmont-error transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>

      {/* Sheet */}
      {sheetOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSheetOpen(false)} />
          <div className="relative bg-background w-full max-w-md flex flex-col shadow-xl overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <h2 className="font-bebas text-2xl">{editId ? "EDITAR CUPÓN" : "NUEVO CUPÓN"}</h2>
              <button onClick={() => setSheetOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 px-6 py-6 flex flex-col gap-5">
              {/* Código */}
              <div>
                <label className={labelClass}>CÓDIGO *</label>
                <input
                  value={form.code}
                  onChange={(e) => setField("code", e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                  className={inputClass}
                  placeholder="VERANO20"
                />
              </div>

              {/* Tipo */}
              <div>
                <label className={labelClass}>TIPO DE DESCUENTO *</label>
                <div className="flex flex-col gap-2">
                  {(["percent", "fixed", "free_shipping"] as const).map((t) => (
                    <label key={t} className="flex items-center gap-3 cursor-pointer text-sm">
                      <input
                        type="radio"
                        name="type"
                        value={t}
                        checked={form.type === t}
                        onChange={() => setField("type", t)}
                        className="accent-brand-green"
                      />
                      {t === "percent" ? "% Porcentaje" : t === "fixed" ? "$ Monto fijo" : "🚚 Envío gratis"}
                    </label>
                  ))}
                </div>
              </div>

              {/* Valor (hidden for free_shipping) */}
              {form.type !== "free_shipping" && (
                <div>
                  <label className={labelClass}>VALOR * {form.type === "percent" ? "(1–100)" : "(en pesos)"}</label>
                  <input
                    type="number"
                    min={1}
                    max={form.type === "percent" ? 100 : undefined}
                    value={form.value}
                    onChange={(e) => setField("value", e.target.value)}
                    className={inputClass}
                    placeholder={form.type === "percent" ? "20" : "500"}
                  />
                </div>
              )}

              {/* Stock */}
              <div>
                <label className={labelClass}>STOCK (USOS DISPONIBLES) *</label>
                <input
                  type="number"
                  min={1}
                  value={form.stock}
                  onChange={(e) => setField("stock", e.target.value)}
                  className={inputClass}
                  placeholder="100"
                />
              </div>

              {/* Compra mínima */}
              <div>
                <label className={labelClass}>COMPRA MÍNIMA (OPCIONAL)</label>
                <input
                  type="number"
                  min={1}
                  value={form.min_purchase}
                  onChange={(e) => setField("min_purchase", e.target.value)}
                  className={inputClass}
                  placeholder="Dejar vacío si no hay mínimo"
                />
              </div>

              {/* Vencimiento */}
              <div>
                <label className={labelClass}>FECHA DE VENCIMIENTO (OPCIONAL)</label>
                <input
                  type="date"
                  value={form.expires_at}
                  onChange={(e) => setField("expires_at", e.target.value)}
                  className={inputClass}
                />
              </div>

              {/* Activo */}
              <label className="flex items-center gap-3 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setField("is_active", e.target.checked)}
                  className="accent-brand-green w-4 h-4"
                />
                ACTIVO
              </label>

              {formError && (
                <p className="label-tag text-valmont-error text-xs">{formError}</p>
              )}
            </div>

            <div className="px-6 py-5 border-t border-border">
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-brand-green text-brand-cream py-3 label-tag text-[11px] hover:bg-green-mid transition-colors disabled:opacity-50"
              >
                {saving ? "GUARDANDO..." : editId ? "GUARDAR CAMBIOS" : "CREAR CUPÓN"}
              </button>
            </div>
          </div>
        </div>
      )}

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="¿Eliminar este cupón?"
        description={`El cupón "${deleteC?.code}" será eliminado permanentemente.`}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
