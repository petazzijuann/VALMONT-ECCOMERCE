"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Package, ShoppingCart, BarChart3, LogOut, Inbox, Mail, Tag, Trophy, Receipt } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const NAV = [
  { href: "/admin",           label: "DASHBOARD",  icon: LayoutDashboard },
  { href: "/admin/pedidos",   label: "PEDIDOS",    icon: Inbox },
  { href: "/admin/productos", label: "PRODUCTOS",  icon: Package },
  { href: "/admin/cupones",   label: "CUPONES",    icon: Tag },
  { href: "/admin/ventas",    label: "VENTAS",     icon: ShoppingCart },
  { href: "/admin/reportes",      label: "REPORTES",     icon: BarChart3 },
  { href: "/admin/suscriptores", label: "SUSCRIPTORES", icon: Mail },
  { href: "/admin/prode",         label: "PRODE",        icon: Trophy },
  { href: "/admin/gastos",        label: "GASTOS",       icon: Receipt },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="w-56 min-h-screen bg-brand-green flex flex-col border-r border-green-mid shrink-0">
      <div className="px-6 py-6 border-b border-green-mid">
        <Link href="/admin">
          <p className="font-bebas text-2xl text-brand-cream tracking-widest">VALMONT</p>
          <p className="label-tag text-cream-dark text-[10px] mt-0.5">ADMIN</p>
        </Link>
      </div>

      <nav className="flex-1 py-4">
        {NAV.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-6 py-3 label-tag text-[11px] transition-colors ${
                isActive
                  ? "bg-green-mid text-brand-cream"
                  : "text-cream-dark hover:text-brand-cream hover:bg-green-mid/50"
              }`}
            >
              <Icon size={15} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-6 py-4 border-t border-green-mid">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 label-tag text-[11px] text-cream-dark hover:text-valmont-error transition-colors w-full"
        >
          <LogOut size={15} />
          CERRAR SESIÓN
        </button>
      </div>
    </aside>
  );
}
