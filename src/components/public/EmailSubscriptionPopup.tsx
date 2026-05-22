"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

const STORAGE_KEY = "valmont_email_popup";

type Status = "idle" | "loading" | "success" | "duplicate" | "error";

export default function EmailSubscriptionPopup() {
  const [visible, setVisible] = useState(false);
  const [email, setEmail]     = useState("");
  const [status, setStatus]   = useState<Status>("idle");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "dismissed" || stored === "subscribed") return;

    const timer = setTimeout(() => setVisible(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "dismissed");
    setVisible(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");

    const res = await fetch("/api/subscriptions", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ email }),
    });

    if (res.ok) {
      setStatus("success");
      localStorage.setItem(STORAGE_KEY, "subscribed");
      setTimeout(() => setVisible(false), 2000);
      return;
    }

    const data = await res.json() as { error?: string };
    if (res.status === 409) {
      setStatus("duplicate");
    } else {
      setStatus("error");
      console.error(data.error);
    }
  }

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center px-4 bg-black/60"
      onClick={(e) => { if (e.target === e.currentTarget) dismiss(); }}
    >
      <div className="relative w-full max-w-md bg-brand-green text-brand-cream p-8">
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 text-cream-dark hover:text-brand-cream transition-colors"
          aria-label="Cerrar"
        >
          <X size={18} />
        </button>

        {status === "success" ? (
          <div className="text-center py-4">
            <p className="font-bebas text-3xl mb-2 tracking-widest">¡GRACIAS!</p>
            <p className="text-cream-dark text-sm">Te avisamos cuando haya novedades.</p>
          </div>
        ) : (
          <>
            <p className="label-tag text-cream-dark text-[10px] mb-2 tracking-widest">COMUNIDAD VALMONT</p>
            <h2 className="font-bebas text-4xl mb-2 tracking-wide">SUMATE A LA LISTA</h2>
            <p className="text-cream-dark text-sm mb-6">
              Enterate primero de los nuevos drops, restocks y beneficios exclusivos.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                className="w-full bg-green-mid border border-green-mid text-brand-cream px-4 py-3 text-sm placeholder:text-cream-dark/40 focus:outline-none focus:border-brand-cream transition-colors"
              />

              {status === "duplicate" && (
                <p className="text-valmont-error text-xs label-tag">Este email ya está suscrito.</p>
              )}
              {status === "error" && (
                <p className="text-valmont-error text-xs label-tag">Error inesperado. Intentá de nuevo.</p>
              )}

              <button
                type="submit"
                disabled={status === "loading"}
                className="bg-brand-cream text-brand-green py-3 font-bold tracking-widest text-sm hover:bg-white transition-colors disabled:opacity-50"
              >
                {status === "loading" ? "PROCESANDO..." : "SUSCRIBIRME"}
              </button>
            </form>

            <button
              onClick={dismiss}
              className="mt-4 w-full text-center text-cream-dark text-xs hover:text-brand-cream transition-colors label-tag"
            >
              NO, GRACIAS
            </button>
          </>
        )}
      </div>
    </div>
  );
}
