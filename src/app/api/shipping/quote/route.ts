import { NextRequest, NextResponse } from "next/server";
import { cotizarEnvio } from "@/lib/andreani/client";
import { prisma } from "@/lib/prisma/client";

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

  const defaultPeso  = parseFloat(process.env.ANDREANI_PACKAGE_WEIGHT_KG ?? "0.5");
  const defaultLargo = parseInt(process.env.ANDREANI_BOX_LARGO_CM ?? "30");
  const defaultAncho = parseInt(process.env.ANDREANI_BOX_ANCHO_CM ?? "20");
  const defaultAlto  = parseInt(process.env.ANDREANI_BOX_ALTO_CM  ?? "5");

  let pesoKg = defaultPeso;
  let dims: { largo: number; ancho: number; alto: number } | undefined;

  const itemsParam = req.nextUrl.searchParams.get("items");
  if (itemsParam) {
    try {
      const cartItems = JSON.parse(itemsParam) as Array<{ id: string; qty: number }>;
      if (Array.isArray(cartItems) && cartItems.length > 0) {
        const products = await prisma.product.findMany({
          where:  { id: { in: cartItems.map((i) => i.id) } },
          select: { id: true, weight_kg: true, length_cm: true, width_cm: true, height_cm: true },
        });

        const withQty = cartItems.flatMap((item) => {
          const p = products.find((p) => p.id === item.id);
          return p ? [{ product: p, quantity: item.qty }] : [];
        });

        if (withQty.length > 0) {
          pesoKg = withQty.reduce((acc, { product, quantity }) =>
            acc + (product.weight_kg ?? defaultPeso) * quantity, 0) || defaultPeso;

          const largo = Math.max(...withQty.map(({ product }) => product.length_cm ?? defaultLargo));
          const ancho = Math.max(...withQty.map(({ product }) => product.width_cm  ?? defaultAncho));
          const alto  = withQty.reduce((acc, { product, quantity }) =>
            acc + (product.height_cm ?? defaultAlto) * quantity, 0) || defaultAlto;

          dims = { largo, ancho, alto };
        }
      }
    } catch {
      // items param inválido — usar defaults
    }
  }

  try {
    const options = await cotizarEnvio(cp, pesoKg, dims);
    return NextResponse.json({ options });
  } catch (err) {
    console.error("Andreani quote error:", err);
    return NextResponse.json(
      { options: [], error: "Servicio no disponible" },
      { status: 200 }
    );
  }
}
