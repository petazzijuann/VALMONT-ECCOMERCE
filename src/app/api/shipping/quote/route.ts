import { NextRequest, NextResponse } from "next/server";
import { cotizarEnvio } from "@/lib/andreani/client";

// Rate limiting básico: 10 requests por minuto por IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 10) return false;
  entry.count++;
  return true;
}

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { options: [], error: "Demasiadas solicitudes. Intentá en un minuto." },
      { status: 429 }
    );
  }

  const cp = req.nextUrl.searchParams.get("cp")?.trim() ?? "";

  if (!/^\d{4,5}$/.test(cp)) {
    return NextResponse.json(
      { options: [], error: "El código postal debe tener 4 o 5 dígitos." },
      { status: 400 }
    );
  }

  const pesoKg =
    parseFloat(process.env.ANDREANI_PACKAGE_WEIGHT_KG ?? "0.5");

  try {
    const options = await cotizarEnvio(cp, pesoKg);
    return NextResponse.json({ options });
  } catch (err) {
    console.error("Andreani quote error:", err);
    return NextResponse.json(
      { options: [], error: "Servicio no disponible" },
      { status: 200 }
    );
  }
}
