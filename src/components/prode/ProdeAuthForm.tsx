"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Props {
  mode: "login" | "register";
}

export default function ProdeAuthForm({ mode }: Props) {
  const router = useRouter();
  const isRegister = mode === "register";

  const [instagram, setInstagram] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const endpoint = isRegister ? "/api/prode/register" : "/api/prode/login";
    const payload = isRegister ? { instagram, email, password } : { email, password };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Algo salió mal. Probá de nuevo.");
        setLoading(false);
        return;
      }
      router.push("/prode/jugar");
      router.refresh();
    } catch {
      setError("No se pudo conectar. Probá de nuevo.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-green-dark flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="label-tag text-cream-dark">PRODE MUNDIAL 2026</p>
          <h1 className="font-bebas text-5xl text-brand-cream tracking-widest mt-1">
            {isRegister ? "CREAR CUENTA" : "INGRESAR"}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {isRegister && (
            <div>
              <label className="label-tag text-cream-dark block mb-2">INSTAGRAM</label>
              <input
                type="text"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                required
                placeholder="@tuusuario"
                className="w-full bg-green-mid border border-green-mid text-brand-cream px-4 py-3 text-sm focus:outline-none focus:border-brand-cream transition-colors placeholder:text-cream-dark/40"
              />
              <p className="text-[11px] text-cream-dark/60 mt-1">
                Es tu identificador en el ranking. Solo podés registrarte una vez.
              </p>
            </div>
          )}

          <div>
            <label className="label-tag text-cream-dark block mb-2">EMAIL</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="tu@email.com"
              className="w-full bg-green-mid border border-green-mid text-brand-cream px-4 py-3 text-sm focus:outline-none focus:border-brand-cream transition-colors placeholder:text-cream-dark/40"
            />
          </div>

          <div>
            <label className="label-tag text-cream-dark block mb-2">CONTRASEÑA</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="••••••••"
              className="w-full bg-green-mid border border-green-mid text-brand-cream px-4 py-3 text-sm focus:outline-none focus:border-brand-cream transition-colors placeholder:text-cream-dark/40"
            />
          </div>

          {error && <p className="label-tag text-valmont-error text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 bg-brand-cream text-brand-green py-4 font-bold tracking-widest text-sm hover:bg-white transition-colors disabled:opacity-50"
          >
            {loading ? "CARGANDO..." : isRegister ? "REGISTRARME Y JUGAR" : "INGRESAR"}
          </button>
        </form>

        <p className="text-center text-cream-dark/70 text-sm mt-6">
          {isRegister ? (
            <>
              ¿Ya tenés cuenta?{" "}
              <Link href="/prode/login" className="text-brand-cream underline hover:text-white">
                Iniciá sesión
              </Link>
            </>
          ) : (
            <>
              ¿No tenés cuenta?{" "}
              <Link href="/prode/registro" className="text-brand-cream underline hover:text-white">
                Registrate
              </Link>
            </>
          )}
        </p>

        <p className="text-center mt-4">
          <Link href="/prode" className="label-tag text-cream-dark/60 hover:text-brand-cream">
            ← VOLVER AL PRODE
          </Link>
        </p>
      </div>
    </div>
  );
}
