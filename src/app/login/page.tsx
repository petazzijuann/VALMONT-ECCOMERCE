"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("Email o contraseña incorrectos.");
      setLoading(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-green-dark flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <h1 className="font-bebas text-5xl text-brand-cream tracking-widest">
            VALMONT
          </h1>
          <p className="label-tag text-cream-dark mt-2">PANEL DE ADMINISTRACIÓN</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="label-tag text-cream-dark block mb-2">EMAIL</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-green-mid border border-green-mid text-brand-cream px-4 py-3 text-sm focus:outline-none focus:border-brand-cream transition-colors placeholder:text-cream-dark/40"
              placeholder="admin@valmont.com"
            />
          </div>

          <div>
            <label className="label-tag text-cream-dark block mb-2">CONTRASEÑA</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-green-mid border border-green-mid text-brand-cream px-4 py-3 text-sm focus:outline-none focus:border-brand-cream transition-colors placeholder:text-cream-dark/40"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="label-tag text-valmont-error text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 bg-brand-cream text-brand-green py-4 font-bold tracking-widest text-sm hover:bg-white transition-colors disabled:opacity-50"
          >
            {loading ? "INGRESANDO..." : "INGRESAR"}
          </button>
        </form>
      </div>
    </div>
  );
}
