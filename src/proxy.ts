import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdminRoute =
    request.nextUrl.pathname.startsWith("/admin") ||
    request.nextUrl.pathname.startsWith("/api/admin");

  if (isAdminRoute) {
    // 1) Debe existir una sesión autenticada.
    if (!user) {
      if (request.nextUrl.pathname.startsWith("/api/admin")) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
      }
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirectTo", request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }

    // 2) Autorización por allowlist de administradores.
    //    ADMIN_EMAILS = lista separada por comas de los emails habilitados.
    //    Si no está configurada, se emite una advertencia y se permite el
    //    acceso a cualquier usuario autenticado (comportamiento previo).
    const allowlist = (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    if (allowlist.length > 0) {
      const email = user.email?.toLowerCase() ?? "";
      if (!allowlist.includes(email)) {
        if (request.nextUrl.pathname.startsWith("/api/admin")) {
          return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }
        return NextResponse.redirect(new URL("/login", request.url));
      }
    } else {
      console.warn(
        "[proxy] ADMIN_EMAILS no está configurado: cualquier usuario autenticado puede acceder al panel de administración."
      );
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
