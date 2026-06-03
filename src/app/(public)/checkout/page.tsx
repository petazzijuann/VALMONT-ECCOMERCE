"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { formatARS } from "@/lib/utils";
import { PROVINCES } from "@/data/argentina";
import type { CouponValidated } from "@/types";

type PaymentMethod = "transfer" | "astropay";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, clearCart, shippingOption } = useCartStore();

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const [coupon,       setCoupon]       = useState<CouponValidated | null>(null);
  const [couponInput,  setCouponInput]  = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError,  setCouponError]  = useState("");

  const [form, setForm] = useState({
    customer_name:  "",
    customer_email: "",
    customer_phone: "",
    street:   "",
    city:     "",
    province: "",
    zip:      "",
  });

  const paymentMethod: PaymentMethod = "transfer";

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <h1 className="font-bebas text-5xl mb-4">CARRITO VACÍO</h1>
        <a href="/tienda" className="label-tag text-brand-green hover:underline">
          Volver a la tienda
        </a>
      </div>
    );
  }

  function setField(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/orders", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        customer_name:    form.customer_name,
        customer_email:   form.customer_email,
        customer_phone:   form.customer_phone,
        customer_address: {
          street:   form.street,
          city:     form.city,
          province: form.province,
          zip:      form.zip,
        },
        items: items.map((i) => ({
          product_id: i.product_id,
          slug:       i.slug,
          name:       i.name,
          size:       i.size,
          color:      i.color ?? null,
          qty:        i.quantity,
          price:      i.price,
        })),
        payment_method:      paymentMethod,
        shipping_method:     shippingOption?.type      ?? null,
        shipping_cost:       shippingOption?.cost      ?? null,
        shipping_days_label: shippingOption?.days_label ?? null,
        coupon_code:         coupon?.code              ?? null,
        discount_amount:     coupon?.discount_amount   ?? null,
      }),
    });

    if (!res.ok) {
      setError("Hubo un error al procesar el pedido. Intentá de nuevo.");
      setLoading(false);
      return;
    }

    const data = await res.json();
    clearCart();

    if (data.payment_url) {
      window.location.href = data.payment_url;
    } else {
      router.push(`/pedido/${data.order_id}`);
    }
  }

  async function handleApplyCoupon() {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    setCouponError("");
    try {
      const res = await fetch("/api/coupons/validate", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ code: couponInput.toUpperCase(), subtotal: totalPrice() }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg =
          data.error === "not_found"    ? "Cupón no encontrado" :
          data.error === "inactive" || data.error === "out_of_stock" || data.error === "expired"
                                        ? "Este cupón ya no está disponible" :
          data.error === "min_purchase" ? `Este cupón requiere una compra mínima de ${formatARS(data.min)}` :
                                          "No pudimos validar el cupón, intentá de nuevo";
        setCouponError(msg);
      } else {
        setCoupon(data as CouponValidated);
        setCouponInput("");
      }
    } catch {
      setCouponError("No pudimos validar el cupón, intentá de nuevo");
    } finally {
      setCouponLoading(false);
    }
  }

  function removeCoupon() {
    setCoupon(null);
    setCouponInput("");
    setCouponError("");
  }

  const inputClass  = "w-full border border-border px-4 py-3 text-sm focus:outline-none focus:border-brand-green transition-colors bg-background";
  const selectClass = `${inputClass} appearance-none`;
  const labelClass  = "label-tag text-xs block mb-1.5";
  const subtotal    = totalPrice();
  const discountOnSubtotal = coupon ? coupon.discount_amount : 0;
  const shippingCost       = coupon?.type === "free_shipping"
    ? 0
    : (shippingOption?.cost ?? 0);
  const total = subtotal - discountOnSubtotal + shippingCost;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="font-bebas text-5xl mb-10">FINALIZAR COMPRA</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Formulario */}
          <div className="lg:col-span-2 flex flex-col gap-8">

            {/* Datos personales */}
            <section>
              <h2 className="font-bebas text-2xl mb-5">DATOS PERSONALES</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className={labelClass}>NOMBRE COMPLETO *</label>
                  <input required value={form.customer_name} onChange={(e) => setField("customer_name", e.target.value)} className={inputClass} placeholder="Juan Pérez" />
                </div>
                <div>
                  <label className={labelClass}>EMAIL *</label>
                  <input required type="email" value={form.customer_email} onChange={(e) => setField("customer_email", e.target.value)} className={inputClass} placeholder="juan@email.com" />
                </div>
                <div>
                  <label className={labelClass}>TELÉFONO *</label>
                  <input required value={form.customer_phone} onChange={(e) => setField("customer_phone", e.target.value)} className={inputClass} placeholder="11 1234-5678" />
                </div>
              </div>
            </section>

            {/* Dirección */}
            <section>
              <h2 className="font-bebas text-2xl mb-5">DIRECCIÓN DE ENVÍO</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className={labelClass}>CALLE Y NÚMERO *</label>
                  <input required value={form.street} onChange={(e) => setField("street", e.target.value)} className={inputClass} placeholder="Av. Corrientes 1234" />
                </div>
                <div>
                  <label className={labelClass}>CIUDAD *</label>
                  <input required value={form.city} onChange={(e) => setField("city", e.target.value)} className={inputClass} placeholder="Rosario" />
                </div>
                <div>
                  <label className={labelClass}>PROVINCIA *</label>
                  <select
                    required
                    value={form.province}
                    onChange={(e) => setField("province", e.target.value)}
                    className={selectClass}
                  >
                    <option value="">Seleccioná tu provincia</option>
                    {PROVINCES.map((p) => (
                      <option key={p.code} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>CÓDIGO POSTAL *</label>
                  <input
                    required
                    value={form.zip}
                    onChange={(e) => setField("zip", e.target.value.replace(/\D/g, ""))}
                    className={inputClass}
                    placeholder="2000"
                    maxLength={5}
                    inputMode="numeric"
                  />
                </div>
              </div>
            </section>

            {/* Envío */}
            <section>
              <h2 className="font-bebas text-2xl mb-5">ENVÍO</h2>
              {shippingOption ? (
                <div className="border border-brand-green bg-brand-green/5 p-4 flex items-start gap-3">
                  <Check size={16} className="text-brand-green mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-sm">{shippingOption.label}</p>
                    <p className="label-tag text-muted-foreground text-[10px] mt-0.5">
                      {shippingOption.days_label} · {shippingOption.cost === 0 ? "Gratis" : formatARS(shippingOption.cost)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="border border-border p-4">
                  <p className="text-sm text-muted-foreground">
                    No seleccionaste un método de envío.{" "}
                    <a href="/carrito" className="text-brand-green hover:underline">
                      Volvé al carrito
                    </a>{" "}
                    para elegirlo.
                  </p>
                </div>
              )}
            </section>

            {/* Método de pago */}
            <section>
              <h2 className="font-bebas text-2xl mb-5">MÉTODO DE PAGO</h2>
              <div className="flex items-center gap-4 border border-brand-green bg-brand-green/5 p-4">
                <div className="w-3 h-3 rounded-full bg-brand-green shrink-0" />
                <div>
                  <p className="font-medium text-sm">Transferencia bancaria</p>
                  <p className="label-tag text-muted-foreground text-[10px] mt-0.5">
                    CBU · Alias · Te enviamos los datos al confirmar
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* Resumen */}
          <div className="lg:col-span-1">
            <div className="border border-border p-6 sticky top-24">
              <h2 className="font-bebas text-2xl mb-5">TU PEDIDO</h2>

              <ul className="flex flex-col gap-3 mb-4">
                {items.map((item) => (
                  <li key={`${item.product_id}-${item.size}-${item.color ?? ""}`} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {item.name} ({item.size}{item.color && item.color !== "Único" ? ` · ${item.color}` : ""}) ×{item.quantity}
                    </span>
                    <span>{formatARS(item.price * item.quantity)}</span>
                  </li>
                ))}
              </ul>

              <div className="border-t border-border pt-3 mb-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatARS(subtotal)}</span>
              </div>

              {coupon && coupon.type !== "free_shipping" && (
                <div className="flex items-center justify-between text-sm mb-1 text-valmont-success">
                  <span>Descuento {coupon.type === "percent" ? `−${coupon.value}%` : "cupón"}</span>
                  <span>−{formatARS(coupon.discount_amount)}</span>
                </div>
              )}

              {shippingOption && (
                <div className="flex items-center justify-between text-sm mb-3">
                  <span className="text-muted-foreground">
                    {coupon?.type === "free_shipping"
                      ? `${shippingOption.label} (gratis)`
                      : shippingOption.label}
                  </span>
                  <span className={coupon?.type === "free_shipping" ? "text-valmont-success" : ""}>
                    {shippingCost === 0 ? "Gratis" : formatARS(shippingCost)}
                  </span>
                </div>
              )}

              {/* Cupón */}
              <div className="border-t border-border pt-4 mb-4">
                {coupon ? (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-valmont-success label-tag text-[11px]">✓ Cupón aplicado: {coupon.code}</span>
                    <button onClick={removeCoupon} className="label-tag text-[10px] text-muted-foreground hover:text-foreground underline">
                      Quitar
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">¿Tenés un cupón de descuento?</p>
                    <div className="flex gap-2">
                      <input
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                        disabled={couponLoading}
                        className="flex-1 border border-border px-3 py-2 text-sm focus:outline-none focus:border-brand-green bg-background disabled:opacity-50"
                        placeholder="CÓDIGO DE CUPÓN"
                      />
                      <button
                        onClick={handleApplyCoupon}
                        disabled={couponLoading || !couponInput}
                        className="label-tag text-[11px] px-4 py-2 bg-brand-green text-brand-cream hover:bg-green-mid transition-colors disabled:opacity-50 shrink-0"
                      >
                        {couponLoading ? "..." : "Aplicar"}
                      </button>
                    </div>
                    {couponError && (
                      <p className="label-tag text-valmont-error text-[10px] mt-1.5">{couponError}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="border-t border-border pt-3 flex items-center justify-between mb-6">
                <p className="label-tag">TOTAL</p>
                <p className="price-text text-xl">{formatARS(total)}</p>
              </div>

              {error && (
                <p className="label-tag text-valmont-error text-center mb-4 text-xs">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-green text-brand-cream py-4 font-bold tracking-widest text-sm hover:bg-green-mid transition-colors disabled:opacity-50"
              >
                {loading ? "PROCESANDO..." : "CONFIRMAR PEDIDO"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
