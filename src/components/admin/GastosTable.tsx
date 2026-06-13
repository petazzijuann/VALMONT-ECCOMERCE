"use client";

import { useState } from "react";
import { Pencil, Trash2, Plus, X } from "lucide-react";
import useSWR from "swr";
import type { ExpensePublic } from "@/types";
import { formatARS } from "@/lib/utils";
import DeleteConfirmDialog from "./DeleteConfirmDialog";

const fetcher = (url: string) => fetch(url).then((r) => r.json() as Promise<ExpensePublic[]>);

const CATEGORIES = ["Packaging", "Marketing", "Servicios", "Logística", "Impuestos", "Otros"];

interface FormState {
  description: string;
  amount: string;
  date: string;
  category: string;
  notes: string;
}

const today = new Date().toISOString().slice(0, 10);

const EMPTY_FORM: FormState = {
  description: "",
  amount: "",
  date: today,
  category: "",
  notes: "",
};

const HEADERS = ["FECHA", "DESCRIPCIÓN", "CATEGORÍA", "MONTO", ""];

export default function GastosTable() {
  const { data: expenses, isLoading, mutate } = useSWR<ExpensePublic[]>("/api/admin/gastos", fetcher);

  const [sheetOpen,  setSheetOpen]  = useState(false);
  const [editId,     setEditId]     = useState<string | null>(null);
  const [form,       setForm]       = useState<FormState>(EMPTY_FORM);
  const [saving,     setSaving]     = useState(false);
  const [formError,  setFormError]  = useState("");

  const [deleteE,    setDeleteE]    = useState<ExpensePublic | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting,   setDeleting]   = useState(false);

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

  function openEdit(e: ExpensePublic) {
    setEditId(e.id);
    setForm({
      description: e.description,
      amount:      String(e.amount),
      date:        e.date,
      category:    e.category ?? "",
      notes:       e.notes ?? "",
    });
    setFormError("");
    setSheetOpen(true);
  }

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave() {
    setFormError("");
    if (!form.description.trim()) { setFormError("La descripción es requerida"); return; }
    if (!form.amount || parseFloat(form.amount) <= 0) { setFormError("El monto debe ser mayor a 0"); return; }
    if (!form.date) { setFormError("La fecha es requerida"); return; }

    setSaving(true);
    const body = {
      description: form.description.trim(),
      amount:      parseFloat(form.amount),
      date:        form.date,
      category:    form.category || null,
      notes:       form.notes.trim() || null,
    };

    const url    = editId ? `/api/admin/gastos/${editId}` : "/api/admin/gastos";
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
    showToast(editId ? "Gasto actualizado" : "Gasto registrado", "ok");
    await mutate();
  }

  function openDelete(e: ExpensePublic) {
    setDeleteE(e);
    setDeleteOpen(true);
  }

  async function handleDelete() {
    if (!deleteE) return;
    setDeleting(true);
    const res = await fetch(`/api/admin/gastos/${deleteE.id}`, { method: "DELETE" });
    setDeleting(false);
    setDeleteOpen(false);
    setDeleteE(null);

    if (res.ok || res.status === 204) {
      showToast("Gasto eliminado", "ok");
      await mutate();
    } else {
      showToast("No se pudo eliminar", "err");
    }
  }

  const total = expenses?.reduce((s, e) => s + e.amount, 0) ?? 0;

  const inputClass  = "w-full border border-border px-3 py-2 text-sm focus:outline-none focus:border-brand-green bg-background transition-colors";
  const labelClass  = "label-tag text-[10px] block mb-1.5 text-muted-foreground";

  const formatDate = (d: string) =>
    new Date(d + "T00:00:00").toLocaleDateString("es-AR", {
      day:   "2-digit",
      month: "2-digit",
      year:  "numeric",
    });

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="label-tag text-muted-foreground text-[10px] mb-1">GESTIÓN</p>
          <h1 className="font-bebas text-5xl">GASTOS</h1>
        </div>
        <button
          onClick={openNew}
          className="label-tag text-[11px] px-5 py-3 bg-brand-green text-brand-cream hover:bg-green-mid transition-colors flex items-center gap-2 shrink-0"
        >
          <Plus size={13} /> NUEVO GASTO
        </button>
      </div>

      {/* Total */}
      <div className="bg-card border border-border px-6 py-4 flex items-baseline gap-3">
        <p className="label-tag text-[10px] text-muted-foreground">TOTAL ACUMULADO</p>
        <p className="font-bebas text-3xl text-valmont-error">{formatARS(total)}</p>
        {expenses && (
          <p className="label-tag text-[10px] text-muted-foreground ml-auto">
            {expenses.length} {expenses.length === 1 ? "registro" : "registros"}
          </p>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 text-sm font-medium shadow-lg ${
          toast.type === "ok" ? "bg-valmont-success text-white" : "bg-valmont-error text-white"
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Table */}
      <div className="bg-card border border-border overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
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
                        <div className="h-4 bg-muted animate-pulse w-20" />
                      </td>
                    ))}
                  </tr>
                ))
              : expenses?.length === 0
              ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground text-sm">
                      No hay gastos registrados todavía.
                    </td>
                  </tr>
                )
              : expenses?.map((e) => (
                  <tr key={e.id} className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{formatDate(e.date)}</td>
                    <td className="px-4 py-3 font-medium max-w-xs truncate">{e.description}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {e.category
                        ? <span className="label-tag text-[10px] border border-border px-2 py-0.5">{e.category}</span>
                        : <span className="text-muted-foreground/50">—</span>}
                    </td>
                    <td className="px-4 py-3 font-medium text-valmont-error whitespace-nowrap">
                      {formatARS(e.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(e)} className="text-muted-foreground hover:text-foreground transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => openDelete(e)} className="text-muted-foreground hover:text-valmont-error transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {/* Sheet */}
      {sheetOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSheetOpen(false)} />
          <div className="relative bg-background w-full max-w-md flex flex-col shadow-xl overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <h2 className="font-bebas text-2xl">{editId ? "EDITAR GASTO" : "NUEVO GASTO"}</h2>
              <button onClick={() => setSheetOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 px-6 py-6 flex flex-col gap-5">
              <div>
                <label className={labelClass}>DESCRIPCIÓN *</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setField("description", e.target.value)}
                  className={inputClass}
                  placeholder="Bolsas kraft, stickers, etc."
                />
              </div>

              <div>
                <label className={labelClass}>MONTO (ARS) *</label>
                <input
                  type="number"
                  min={0.01}
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setField("amount", e.target.value)}
                  className={inputClass}
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className={labelClass}>FECHA *</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setField("date", e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>CATEGORÍA (OPCIONAL)</label>
                <select
                  value={form.category}
                  onChange={(e) => setField("category", e.target.value)}
                  className={inputClass}
                >
                  <option value="">— Sin categoría —</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>NOTAS (OPCIONAL)</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setField("notes", e.target.value)}
                  rows={3}
                  className={inputClass}
                  placeholder="Detalle adicional..."
                />
              </div>

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
                {saving ? "GUARDANDO..." : editId ? "GUARDAR CAMBIOS" : "REGISTRAR GASTO"}
              </button>
            </div>
          </div>
        </div>
      )}

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="¿Eliminar este gasto?"
        description={deleteE ? `"${deleteE.description}" (${formatARS(deleteE.amount)}) será eliminado permanentemente.` : ""}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
