import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return !!user;
}

export async function GET(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const format = request.nextUrl.searchParams.get("format");

  const subscribers = await prisma.subscriber.findMany({
    orderBy: { created_at: "desc" },
  });

  if (format === "csv") {
    const rows = subscribers.map((s) =>
      `${s.email},${s.created_at.toISOString().slice(0, 10)}`
    );
    const csv = ["email,fecha", ...rows].join("\n");
    const date = new Date().toISOString().slice(0, 10);
    return new NextResponse(csv, {
      headers: {
        "Content-Type":        "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="valmont-suscriptores-${date}.csv"`,
      },
    });
  }

  return NextResponse.json(
    subscribers.map((s) => ({ ...s, created_at: s.created_at.toISOString() }))
  );
}
