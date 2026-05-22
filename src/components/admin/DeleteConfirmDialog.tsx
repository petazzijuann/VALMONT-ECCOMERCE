"use client";

import { useEffect } from "react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => Promise<void>;
  loading: boolean;
}

export default function DeleteConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  loading,
}: Props) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => !loading && onOpenChange(false)}
      />

      {/* Dialog */}
      <div className="relative z-10 bg-card border border-border w-full max-w-md mx-4 p-6 shadow-xl">
        <h2 className="font-bebas text-2xl mb-2">{title}</h2>
        <p className="text-sm text-muted-foreground mb-6">{description}</p>

        <div className="flex justify-end gap-3">
          <button
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="label-tag text-[11px] px-5 py-2 border border-border hover:bg-muted transition-colors disabled:opacity-50"
          >
            CANCELAR
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="label-tag text-[11px] px-5 py-2 bg-valmont-error text-white hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "ELIMINANDO..." : "ELIMINAR"}
          </button>
        </div>
      </div>
    </div>
  );
}
