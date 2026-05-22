"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function ProofUpload({ orderId }: { orderId: string }) {
  const [file, setFile]       = useState<File | null>(null);
  const [status, setStatus]   = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router   = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    setStatus("uploading");
    setErrorMsg("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
      if (!uploadRes.ok) throw new Error("Error subiendo imagen");
      const { url } = await uploadRes.json() as { url: string };

      const confirmRes = await fetch(`/api/orders/${orderId}/confirm`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ payment_proof_url: url }),
      });
      if (!confirmRes.ok) throw new Error("Error confirmando pedido");

      setStatus("done");
      router.refresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Error inesperado");
      setStatus("error");
    }
  }

  if (status === "done") return null;

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
      <p className="font-bebas text-lg tracking-widest">SUBIR COMPROBANTE</p>

      <div
        onClick={() => inputRef.current?.click()}
        className="border border-dashed border-green-mid p-4 text-center cursor-pointer hover:border-brand-cream transition-colors"
      >
        <p className="text-sm text-cream-dark">
          {file ? file.name : "Tocá para seleccionar la imagen del comprobante"}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </div>

      {errorMsg && (
        <p className="label-tag text-valmont-error text-[10px]">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={!file || status === "uploading"}
        className="bg-brand-cream text-brand-green py-3 font-bold tracking-widest text-sm hover:bg-white transition-colors disabled:opacity-40"
      >
        {status === "uploading" ? "ENVIANDO..." : "ENVIAR COMPROBANTE"}
      </button>
    </form>
  );
}
