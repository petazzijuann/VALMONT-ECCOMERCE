"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { formatARS } from "@/lib/utils";
import type { ShippingOption } from "@/types";

type PaymentMethod = "transfer" | "astropay";
type QuoteStatus = "idle" | "loading" | "done" | "error";

export default function CheckoutPage() {
  const router = useRouter();
  const {
    items, totalPrice, clearCart,
    shippingOption, shippingCp,
    setShippingOption, setShippingCp,
    totalWithShipping,
  } = useCartStore();

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const [form, setForm] = useState({
    customer_name:  "",
    customer_email: "",
    customer_phone: "",
    street:   "",
    city:     "",
    province: "",
    zip:      shippingCp, // pre-llenado desde el carrito
  });

  // Recotización si el CP cambió en el checkout
  const [cpChanged,    setCpChanged]    = useState(false);
  const [cpInput,      setCpInput]      = useState(shippingCp);
  const [quoteStatus,  setQuoteStatus]  = useState<QuoteStatus>("idle");
  const [quoteOptions, setQuoteOptions] = useState<ShippingOption[]>([]);
  const [quoteError,   setQuoteError]   = useState("");

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
    if (key === "zip" && value !== shippingCp && shippingOption) {
      setCpChanged(true);
    }
  }

  async function handleRequote() {
    if (!/^\d{4,5}$/.test(cpInput.trim())) {
      setQuoteError("El código postal debe tener 4 o 5 dígitos.");
      return;
    }
    setQuoteStatus("loading");
    setQuoteError("");
    setShippingOption(null);
    setCpChanged(false);

    try {
      const res  = await fetch(`/api/shipping/quote?cp=${encodeURIComponent(cpInput.trim())}`);
      const data = await res.json() as { options: ShippingOption[]; error?: string };

      if (data.error || data.options.length === 0) {
        setQuoteError(data.error ?? "No pudimos cotizar. Intentá de nuevo.");
        setQuoteStatus("error");
        return;
      }

      setQuoteOptions(data.options);
      setShippingCp(cpInput.trim());
      setShippingOption(data.options[0]);
      setField("zip", cpInput.trim());
      setQuoteStatus("done");
    } catch {
      setQuoteError("No pudimos cotizar. Intentá de nuevo.");
      setQuoteStatus("error");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
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
          qty:        i.quantity,
          price:      i.price,
        })),
        payment_method:     paymentMethod,
        shipping_method:    shippingOption?.type    ?? null,
        shipping_cost:      shippingOption?.cost    ?? null,
        shipping_cp:        shippingCp              || null,
        shipping_days_label: shippingOption?.days_label ?? null,
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

  const inputClass = "w-full border border-border px-4 py-3 text-sm focus:outline-none focus:border-brand-green transition-colors bg-background";
  const labelClass = "label-tag text-xs block mb-1.5";
  const subtotal   = totalPrice();
  const total      = totalWithShipping();

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
                  <input required value={form.province} onChange={(e) => setField("province", e.target.value)} className={inputClass} placeholder="Santa Fe" />
                </div>
                <div>
                  <label className={labelClass}>CÓDIGO POSTAL *</label>
                  <input
                    required
                    value={form.zip}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "");
                      setField("zip", v);
                      setCpInput(v);
                    }}
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

              {/* Ya seleccionado desde el carrito */}
              {shippingOption && !cpChanged && (
                <div className="border border-brand-green bg-brand-green/5 p-4 flex items-start gap-3">
                  <Check size={16} className="text-brand-green mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-sm">{shippingOption.label}</p>
                    <p className="label-tag text-muted-foreground text-[10px] mt-0.5">
                      {shippingOption.days_label} · {formatARS(shippingOption.cost)}
                    </p>
                  </div>
                </div>
              )}

              {/* CP cambió — ofrecer recotizar */}
              {cpChanged && (
                <div className="border border-border p-4">
                  <p className="text-sm text-muted-foreground mb-3">
                    El código postal cambió. ¿Querés recotizar el envío?
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={5}
                      value={cpInput}
                      onChange={(e) => setCpInput(e.target.value.replace(/\D/g, ""))}
                      placeholder={shippingCp || "CP"}
                      className="flex-1 border border-border px-3 py-2 text-sm focus:outline-none focus:border-brand-green transition-colors bg-background"
                    />
                    <button
                      type="button"
                      onClick={handleRequote}
                      disabled={quoteStatus === "loading"}
                      className="label-tag text-xs px-4 py-2 border border-brand-green text-brand-green hover:bg-brand-green hover:text-brand-cream transition-colors disabled:opacity-40"
                    >
                      {quoteStatus === "loading" ? "..." : "RECOTIZAR"}
                    </button>
                  </div>
                  {quoteError && <p className="text-valmont-error text-xs label-tag mt-2">{quoteError}</p>}
                  {quoteStatus === "done" && quoteOptions.map((opt) => (
                    <button
                      key={opt.type}
                      type="button"
                      onClick={() => setShippingOption(opt)}
                      className={`w-full text-left border p-3 mt-2 transition-colors ${
                        shippingOption?.type === opt.type
                          ? "border-brand-green bg-brand-green/5"
                          : "border-border"
                      }`}
                    >
                      <p className="label-tag text-xs">{opt.label} — {opt.days_label}</p>
                      <p className="text-sm">{formatARS(opt.cost)}</p>
                    </button>
                  ))}
                </div>
              )}

              {/* Sin envío cotizado */}
              {!shippingOption && !cpChanged && (
                <div className="border border-border p-4">
                  <p className="text-sm text-muted-foreground mb-3">
                    No seleccionaste un método de envío en el carrito. Podés continuar sin cotización o ingresar tu CP:
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={5}
                      value={cpInput}
                      onChange={(e) => setCpInput(e.target.value.replace(/\D/g, ""))}
                      placeholder="Ej: 2000"
                      className="flex-1 border border-border px-3 py-2 text-sm focus:outline-none focus:border-brand-green transition-colors bg-background"
                    />
                    <button
                      type="button"
                      onClick={handleRequote}
                      disabled={quoteStatus === "loading"}
                      className="label-tag text-xs px-4 py-2 border border-brand-green text-brand-green hover:bg-brand-green hover:text-brand-cream transition-colors disabled:opacity-40"
                    >
                      {quoteStatus === "loading" ? "..." : "CALCULAR"}
                    </button>
                  </div>
                  {quoteError && <p className="text-valmont-error text-xs label-tag mt-2">{quoteError}</p>}
                  {quoteStatus === "done" && quoteOptions.map((opt) => (
                    <button
                      key={opt.type}
                      type="button"
                      onClick={() => setShippingOption(opt)}
                      className={`w-full text-left border p-3 mt-2 transition-colors ${
                        shippingOption?.type === opt.type
                          ? "border-brand-green bg-brand-green/5"
                          : "border-border"
                      }`}
                    >
                      <p className="label-tag text-xs">{opt.label} — {opt.days_label}</p>
                      <p className="text-sm">{formatARS(opt.cost)}</p>
                    </button>
                  ))}
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
                  <li key={`${item.product_id}-${item.size}`} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.name} ({item.size}) ×{item.quantity}</span>
                    <span>{formatARS(item.price * item.quantity)}</span>
                  </li>
                ))}
              </ul>

              <div className="border-t border-border pt-3 mb-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatARS(subtotal)}</span>
              </div>

              {shippingOption && (
                <div className="flex items-center justify-between text-sm mb-3">
                  <span className="text-muted-foreground">{shippingOption.label}</span>
                  <span>{formatARS(shippingOption.cost)}</span>
                </div>
              )}

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
