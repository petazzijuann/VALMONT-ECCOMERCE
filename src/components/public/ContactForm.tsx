"use client";

import { useState } from "react";
import { z } from "zod";
import { Check } from "lucide-react";

const schema = z.object({
  nombre:  z.string().min(2, "Ingresá tu nombre"),
  email:   z.string().email("Email inválido"),
  asunto:  z.string().max(100).optional(),
  mensaje: z.string().min(10, "El mensaje es demasiado corto"),
});

type Status = "idle" | "loading" | "success" | "error";

function FloatingField({
  id, label, type = "text", required = false, maxLength, isTextarea = false,
  value, onChange, error,
}: {
  id: string; label: string; type?: string; required?: boolean;
  maxLength?: number; isTextarea?: boolean;
  value: string; onChange: (v: string) => void; error?: string;
}) {
  const base =
    "peer w-full bg-transparent border-b border-border pt-5 pb-2 text-sm focus:outline-none focus:border-brand-green transition-colors placeholder-transparent";
  const labelCls =
    "absolute left-0 top-5 text-sm text-muted-foreground transition-all duration-200 " +
    "peer-focus:top-0 peer-focus:text-xs peer-focus:text-brand-green " +
    "peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:text-xs";

  return (
    <div className="relative">
      {isTextarea ? (
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder=" "
          required={required}
          maxLength={maxLength}
          rows={5}
          className={`${base} resize-none`}
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder=" "
          required={required}
          maxLength={maxLength}
          className={base}
        />
      )}
      <label htmlFor={id} className={labelCls}>{label}</label>
      {error && <p className="label-tag text-valmont-error text-[10px] mt-1">{error}</p>}
    </div>
  );
}

export default function ContactForm() {
  const [form, setForm]     = useState({ nombre: "", email: "", asunto: "", mensaje: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status>("idle");
  const [serverError, setServerError] = useState("");

  function set(field: string) {
    return (v: string) => setForm((f) => ({ ...f, [field]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setServerError("");

    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.errors.forEach((err) => { errs[String(err.path[0])] = err.message; });
      setErrors(errs);
      return;
    }

    setStatus("loading");
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      setStatus("success");
      setTimeout(() => {
        setForm({ nombre: "", email: "", asunto: "", mensaje: "" });
        setStatus("idle");
      }, 3000);
    } else {
      const data = await res.json() as { error?: string };
      setServerError(data.error ?? "Error al enviar. Intentá de nuevo.");
      setStatus("error");
    }
  }

  const isLoading = status === "loading";
  const isSuccess = status === "success";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <FloatingField id="nombre"  label="Nombre *"  value={form.nombre}  onChange={set("nombre")}  required error={errors.nombre} />
      <FloatingField id="email"   label="Email *"   type="email" value={form.email}   onChange={set("email")}   required error={errors.email} />
      <FloatingField id="asunto"  label="Asunto"    value={form.asunto}  onChange={set("asunto")}  maxLength={100} />
      <FloatingField id="mensaje" label="Mensaje *" value={form.mensaje} onChange={set("mensaje")} required isTextarea error={errors.mensaje} />

      {isSuccess && (
        <p className="label-tag text-valmont-success text-xs">
          ✓ Recibimos tu consulta. Te respondemos en menos de 24hs.
        </p>
      )}
      {status === "error" && serverError && (
        <p className="label-tag text-valmont-error text-xs">{serverError}</p>
      )}

      <button
        type="submit"
        disabled={isLoading || isSuccess}
        className="relative overflow-hidden group w-full py-4 bg-brand-green text-brand-cream font-bold tracking-widest text-sm flex items-center justify-center gap-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {!isLoading && !isSuccess && (
          <span className="absolute inset-0 bg-brand-cream -translate-x-full group-hover:translate-x-0 transition-transform duration-100 ease-in-out" aria-hidden />
        )}
        <span className={`relative z-10 flex items-center gap-2 transition-colors duration-100 ${!isLoading && !isSuccess ? "group-hover:text-brand-green" : ""}`}>
          {isSuccess ? (
            <><Check size={16} />MENSAJE ENVIADO</>
          ) : isLoading ? (
            <><span className="w-4 h-4 border-2 border-brand-cream/40 border-t-brand-cream rounded-full animate-spin" />ENVIANDO...</>
          ) : (
            "ENVIAR MENSAJE"
          )}
        </span>
      </button>
    </form>
  );
}
