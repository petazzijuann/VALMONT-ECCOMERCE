"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cart";
import { formatARS } from "@/lib/utils";
import type { EnvioOption } from "@/types";

type PaymentMethod = "transfer" | "astropay";
type QuoteStatus   = "idle" | "loading" | "done" | "error";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCartStore();

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const [form, setForm] = useState({
    customer_name:  "",
    customer_email: "",
    customer_phone: "",
    street:   "",
    city:     "",
    province: "",
    zip:      "",
  });

  const [selectedShipping, setSelectedShipping] = useState<EnvioOption | null>(null);
  const [quoteStatus,  setQuoteStatus]  = useState<QuoteStatus>("idle");
  const [quoteOptions, setQuoteOptions] = useState<EnvioOption[]>([]);
  const [quoteError,   setQuoteError]   = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const paymentMethod: PaymentMethod = "transfer";

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

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

  async function quoteShipping(cp: string, city: string, state: string) {
    setQuoteStatus("loading");
    setQuoteError("");
    setSelectedShipping(null);
    setQuoteOptions([]);
    try {
      const res  = await fetch("/api/shipping/quote", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          cp_destino:    cp.trim(),
          city_destino:  city.trim(),
          state_destino: state.trim(),
          cart_items:    items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
          subtotal:      totalPrice(),
        }),
      });
      const data = await res.json() as { options: EnvioOption[]; error?: string };
      if (data.error || !data.options?.length) {
        setQuoteError(data.error ?? "No pudimos cotizar para ese CP.");
        setQuoteStatus("error");
        return;
      }
      setQuoteOptions(data.options);
      setSelectedShipping(data.options[0]);
      setQuoteStatus("done");
    } catch {
      setQuoteError("No pudimos cotizar. Intentá de nuevo.");
      setQuoteStatus("error");
    }
  }

  function triggerQuote(cp: string, city: string, state: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (cp.length >= 4 && city.length >= 2) {
      debounceRef.current = setTimeout(() => quoteShipping(cp, city, state), 600);
    } else {
      setQuoteStatus("idle");
      setQuoteOptions([]);
      setSelectedShipping(null);
    }
  }

  function handleZipChange(v: string) {
    setField("zip", v);
    triggerQuote(v, form.city, form.province);
  }

  function handleCityChange(v: string) {
    setField("city", v);
    if (form.zip.length >= 4) triggerQuote(form.zip, v, form.province);
  }

  function handleProvinceChange(v: string) {
    setField("province", v);
    if (form.zip.length >= 4 && form.city.length >= 2) triggerQuote(form.zip, form.city, v);
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
        payment_method:       paymentMethod,
        shipping_method:      selectedShipping?.carrier_id       ?? null,
        shipping_cost:        selectedShipping?.cost             ?? null,
        shipping_cp:          form.zip                           || null,
        shipping_days_label:  selectedShipping?.days_label       ?? null,
        shipping_carrier:     selectedShipping?.carrier_id       ?? null,
        shipping_carrier_name: selectedShipping?.carrier_name    ?? null,
        shipping_service_id:  selectedShipping?.service_id      ?? null,
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
  const total      = subtotal + (selectedShipping?.cost ?? 0);

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
                  <input required value={form.city} onChange={(e) => handleCityChange(e.target.value)} className={inputClass} placeholder="Rosario" />
                </div>
                <div>
                  <label className={labelClass}>PROVINCIA *</label>
                  <input required value={form.province} onChange={(e) => handleProvinceChange(e.target.value)} className={inputClass} placeholder="Santa Fe" />
                </div>
                <div>
                  <label className={labelClass}>CÓDIGO POSTAL *</label>
                  <input
                    required
                    value={form.zip}
                    onChange={(e) => handleZipChange(e.target.value.replace(/\D/g, ""))}
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

              {quoteStatus === "idle" && (
                <p className="text-sm text-muted-foreground">
                  {form.zip.length >= 4 && (!form.city || !form.province)
                    ? "Completá ciudad y provincia para calcular el envío."
                    : "Completá ciudad, provincia y CP para calcular el envío."}
                </p>
              )}

              {quoteStatus === "loading" && (
                <div className="flex flex-col gap-2">
                  <div className="h-14 bg-muted animate-pulse" />
                  <div className="h-14 bg-muted animate-pulse" />
                </div>
              )}

              {quoteStatus === "error" && (
                <p className="text-valmont-error text-xs label-tag">{quoteError}</p>
              )}

              {quoteStatus === "done" && quoteOptions.map((opt) => {
                const sel = selectedShipping?.carrier_id === opt.carrier_id && selectedShipping?.service_id === opt.service_id;
                return (
                  <button
                    key={`${opt.carrier_id}-${opt.service_id}`}
                    type="button"
                    onClick={() => setSelectedShipping(opt)}
                    className={`w-full text-left border p-4 mb-2 transition-colors ${
                      sel ? "border-brand-green bg-brand-green/5" : "border-border hover:border-brand-green/50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`mt-0.5 w-3 h-3 rounded-full border-2 shrink-0 ${sel ? "border-brand-green bg-brand-green" : "border-border"}`} />
                      <div className="flex-1">
                        <p className="label-tag text-xs">{opt.carrier_name}</p>
                        <div className="flex items-center justify-between mt-0.5">
                          <p className="text-muted-foreground text-xs">{opt.days_label}</p>
                          <p className="text-sm font-medium">{formatARS(opt.cost)}</p>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
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
                    <span className="text-muted-foreground">{item.name} ({item.size}{item.color && item.color !== "Único" ? ` · ${item.color}` : ""}) ×{item.quantity}</span>
                    <span>{formatARS(item.price * item.quantity)}</span>
                  </li>
                ))}
              </ul>

              <div className="border-t border-border pt-3 mb-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatARS(subtotal)}</span>
              </div>

              {selectedShipping && (
                <div className="flex items-center justify-between text-sm mb-3">
                  <span className="text-muted-foreground">{selectedShipping.carrier_name}</span>
                  <span>{formatARS(selectedShipping.cost)}</span>
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
