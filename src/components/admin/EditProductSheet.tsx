"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import type { ProductAdmin, StockMap, ColorVariant } from "@/types";

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;
const CATEGORIES = ["remeras", "pantalones", "buzos", "accesorios", "calzado"] as const;

interface Props {
  product: ProductAdmin | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved: () => void;
}

interface FormState {
  name: string;
  description: string;
  category: string;
  price_sale: string;
  price_cost: string;
  stock: Record<string, string>;
  colorVariants: Array<{ name: string; images: string[]; stock: Record<string, string> }>;
  tags: string;
  is_published: boolean;
}

function toForm(p: ProductAdmin): FormState {
  const stock = p.stock as StockMap;
  const variants = (p.color_variants ?? []) as ColorVariant[];
  return {
    name:         p.name,
    description:  p.description ?? "",
    category:     p.category,
    price_sale:   String(p.price_sale),
    price_cost:   String(p.price_cost),
    stock:        Object.fromEntries(SIZES.map((s) => [s, String(stock[s] ?? 0)])),
    colorVariants: variants.map((v) => ({
      name:   v.name,
      images: v.images,
      stock:  Object.fromEntries(SIZES.map((s) => [s, String(v.stock[s] ?? 0)])),
    })),
    tags:         p.tags.join(", "),
    is_published: p.is_published,
  };
}

export default function EditProductSheet({ product, open, onOpenChange, onSaved }: Props) {
  const [form, setForm]     = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  useEffect(() => {
    if (product) setForm(toForm(product));
    setError(null);
  }, [product]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  async function handleSave() {
    if (!form || !product) return;

    const price_sale = parseFloat(form.price_sale);
    const price_cost = parseFloat(form.price_cost);

    if (!form.name.trim()) { setError("El nombre es requerido."); return; }
    if (isNaN(price_sale) || price_sale <= 0) { setError("Precio de venta inválido."); return; }
    if (isNaN(price_cost) || price_cost <= 0) { setError("Precio de costo inválido."); return; }

    const tags = form.tags.split(",").map((t) => t.trim()).filter(Boolean);

    const hasVariants = form.colorVariants.length > 1;

    // Flat stock: use first variant if multi-color, otherwise form.stock
    const flatStock = hasVariants
      ? Object.fromEntries(SIZES.map((s) => [s, parseInt(form.colorVariants[0].stock[s] ?? "0", 10) || 0]))
      : Object.fromEntries(SIZES.map((s) => [s, Math.max(0, parseInt(form.stock[s] ?? "0", 10) || 0)]));

    const body: Record<string, unknown> = {
      name:         form.name.trim(),
      description:  form.description.trim(),
      category:     form.category,
      price_sale,
      price_cost,
      stock:        flatStock,
      tags,
      is_published: form.is_published,
    };

    if (hasVariants) {
      body.color_variants = form.colorVariants.map((v) => ({
        name:   v.name,
        images: v.images,
        stock:  Object.fromEntries(
          SIZES.map((s) => [s, Math.max(0, parseInt(v.stock[s] ?? "0", 10) || 0)])
        ),
      }));
    }

    setSaving(true);
    setError(null);

    const res = await fetch(`/api/admin/products/${product.id}`, {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Error al guardar.");
      return;
    }

    onSaved();
    onOpenChange(false);
  }

  if (!open || !form) return null;

  function setField<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm((prev) => prev ? { ...prev, [key]: val } : prev);
  }

  const isMultiColor = form.colorVariants.length > 1;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => !saving && onOpenChange(false)}
      />

      <div className="relative z-10 bg-card border-l border-border w-full max-w-lg flex flex-col shadow-xl overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
          <h2 className="font-bebas text-2xl tracking-wide">EDITAR PRODUCTO</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="p-1 hover:text-muted-foreground transition-colors"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 px-6 py-6 space-y-5 overflow-y-auto">

          <div>
            <label className="label-tag text-[10px] text-muted-foreground block mb-1">SLUG (solo lectura)</label>
            <p className="text-sm text-muted-foreground bg-muted px-3 py-2">{product?.slug}</p>
          </div>

          <div>
            <label className="label-tag text-[10px] text-muted-foreground block mb-1">NOMBRE *</label>
            <input
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              className="w-full border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand-green transition-colors"
            />
          </div>

          <div>
            <label className="label-tag text-[10px] text-muted-foreground block mb-1">DESCRIPCIÓN</label>
            <textarea
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              rows={3}
              className="w-full border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand-green transition-colors resize-none"
            />
          </div>

          <div>
            <label className="label-tag text-[10px] text-muted-foreground block mb-1">CATEGORÍA *</label>
            <select
              value={form.category}
              onChange={(e) => setField("category", e.target.value)}
              className="w-full border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand-green transition-colors"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-tag text-[10px] text-muted-foreground block mb-1">PRECIO VENTA *</label>
              <input
                type="number" min="0"
                value={form.price_sale}
                onChange={(e) => setField("price_sale", e.target.value)}
                className="w-full border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand-green transition-colors"
              />
            </div>
            <div>
              <label className="label-tag text-[10px] text-muted-foreground block mb-1">PRECIO COSTO *</label>
              <input
                type="number" min="0"
                value={form.price_cost}
                onChange={(e) => setField("price_cost", e.target.value)}
                className="w-full border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand-green transition-colors"
              />
            </div>
          </div>

          {/* Stock — single color */}
          {!isMultiColor && (
            <div>
              <label className="label-tag text-[10px] text-muted-foreground block mb-2">STOCK POR TALLE</label>
              <div className="grid grid-cols-3 gap-2">
                {SIZES.map((size) => (
                  <div key={size}>
                    <label className="label-tag text-[9px] text-muted-foreground block mb-1">{size}</label>
                    <input
                      type="number" min="0"
                      value={form.stock[size] ?? "0"}
                      onChange={(e) =>
                        setForm((prev) =>
                          prev ? { ...prev, stock: { ...prev.stock, [size]: e.target.value } } : prev
                        )
                      }
                      className="w-full border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-brand-green transition-colors"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stock — multi color */}
          {isMultiColor && (
            <div>
              <label className="label-tag text-[10px] text-muted-foreground block mb-3">STOCK POR COLOR Y TALLE</label>
              <div className="flex flex-col gap-4">
                {form.colorVariants.map((variant, vi) => (
                  <div key={variant.name} className="border border-border p-3">
                    <p className="label-tag text-[10px] text-brand-green mb-2">{variant.name.toUpperCase()}</p>
                    <div className="grid grid-cols-3 gap-2">
                      {SIZES.map((size) => (
                        <div key={size}>
                          <label className="label-tag text-[9px] text-muted-foreground block mb-1">{size}</label>
                          <input
                            type="number" min="0"
                            value={variant.stock[size] ?? "0"}
                            onChange={(e) =>
                              setForm((prev) => {
                                if (!prev) return prev;
                                const updated = prev.colorVariants.map((v, i) =>
                                  i === vi
                                    ? { ...v, stock: { ...v.stock, [size]: e.target.value } }
                                    : v
                                );
                                return { ...prev, colorVariants: updated };
                              })
                            }
                            className="w-full border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-brand-green transition-colors"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="label-tag text-[10px] text-muted-foreground block mb-1">TAGS (separados por coma)</label>
            <input
              value={form.tags}
              onChange={(e) => setField("tags", e.target.value)}
              placeholder="oversize, negro, algodón"
              className="w-full border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand-green transition-colors"
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <label className="label-tag text-[10px] text-muted-foreground">PUBLICADO</label>
            <button
              type="button"
              onClick={() => setField("is_published", !form.is_published)}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                form.is_published ? "bg-brand-green" : "bg-muted"
              }`}
              aria-pressed={form.is_published}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                  form.is_published ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {error && <p className="text-sm text-valmont-error">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-5 border-t border-border shrink-0">
          <button
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="label-tag text-[11px] px-5 py-2 border border-border hover:bg-muted transition-colors disabled:opacity-50"
          >
            CANCELAR
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="label-tag text-[11px] px-5 py-2 bg-brand-green text-brand-cream hover:bg-green-mid transition-colors disabled:opacity-50"
          >
            {saving ? "GUARDANDO..." : "GUARDAR CAMBIOS"}
          </button>
        </div>
      </div>
    </div>
  );
}
