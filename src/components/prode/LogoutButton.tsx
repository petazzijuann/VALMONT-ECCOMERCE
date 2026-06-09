"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    await fetch("/api/prode/logout", { method: "POST" });
    router.refresh();
  }

  return (
    <button onClick={handleLogout} disabled={loading} className={className}>
      {loading ? "SALIENDO…" : "CERRAR SESIÓN"}
    </button>
  );
}
