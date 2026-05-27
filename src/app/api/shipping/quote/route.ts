import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { cotizarEnviocom } from "@/lib/enviador/client";

// Rate limiting: 10 requests por minuto por IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now   = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 10) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { options: [], error: "Demasiadas solicitudes. Intentá en un minuto." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const { cp_destino, cart_items, subtotal } = (body ?? {}) as {
    cp_destino?: string;
    cart_items?: Array<{ product_id: string; quantity: number }>;
    subtotal?:   number;
  };

  if (!cp_destino || !/^\d{4,5}$/.test(cp_destino.trim())) {
    return NextResponse.json(
      { options: [], error: "El código postal debe tener 4 o 5 dígitos." },
      { status: 400 }
    );
  }

  const cpOrigen     = process.env.ENVIADOR_ORIGIN_CP       ?? "2000";
  const defaultPeso  = parseFloat(process.env.ENVIADOR_DEFAULT_WEIGHT_KG ?? "0.5");
  const defaultLargo = parseInt(process.env.ENVIADOR_BOX_LARGO_CM ?? "40");
  const defaultAncho = parseInt(process.env.ENVIADOR_BOX_ANCHO_CM ?? "30");
  const defaultAlto  = parseInt(process.env.ENVIADOR_BOX_ALTO_CM  ?? "5");

  let peso  = defaultPeso;
  let largo = defaultLargo;
  let ancho = defaultAncho;
  let alto  = defaultAlto;

  if (Array.isArray(cart_items) && cart_items.length > 0) {
    const products = await prisma.product.findMany({
      where:  { id: { in: cart_items.map((i) => i.product_id) } },
      select: { id: true, weight_kg: true, length_cm: true, width_cm: true, height_cm: true },
    });

    const withQty = cart_items.flatMap((item) => {
      const p = products.find((p) => p.id === item.product_id);
      return p ? [{ product: p, quantity: item.quantity }] : [];
    });

    if (withQty.length > 0) {
      const totalUnits = withQty.reduce((sum, { quantity }) => sum + quantity, 0);
      peso  = withQty.reduce((acc, { product, quantity }) =>
        acc + (product.weight_kg ?? defaultPeso) * quantity, 0) || defaultPeso;
      largo = Math.max(...withQty.map(({ product }) => product.length_cm ?? defaultLargo));
      ancho = Math.max(...withQty.map(({ product }) => product.width_cm  ?? defaultAncho));
      const unitAlto = Math.max(...withQty.map(({ product }) => product.height_cm ?? defaultAlto));
      alto  = unitAlto * Math.ceil(totalUnits / 2);
    }
  }

  try {
    const options = await cotizarEnviocom({
      cpDestino:      cp_destino.trim(),
      cpOrigen,
      peso,
      largo,
      ancho,
      alto,
      valorDeclarado: subtotal ?? 0,
    });
    return NextResponse.json({ options });
  } catch (err) {
    console.error("Envia.com quote error:", err);
    return NextResponse.json({ options: [] }, { status: 200 });
  }
}
