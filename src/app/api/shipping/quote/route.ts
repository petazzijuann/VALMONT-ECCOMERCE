import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { cotizarEnviocom } from "@/lib/enviador/client";

// Mapa de nombres de provincia → código corto que acepta Envia.com
const PROVINCE_CODE: Record<string, string> = {
  "buenos aires":                    "BA",
  "ciudad autónoma de buenos aires": "CABA",
  "ciudad autonoma de buenos aires": "CABA",
  "caba":                            "CABA",
  "capital federal":                 "CABA",
  "catamarca":                       "CA",
  "chaco":                           "CH",
  "chubut":                          "CU",
  "córdoba":                         "CO",
  "cordoba":                         "CO",
  "corrientes":                      "CR",
  "entre ríos":                      "ER",
  "entre rios":                      "ER",
  "formosa":                         "FO",
  "jujuy":                           "JU",
  "la pampa":                        "LP",
  "la rioja":                        "LR",
  "mendoza":                         "MZ",
  "misiones":                        "MI",
  "neuquén":                         "NQ",
  "neuquen":                         "NQ",
  "río negro":                       "RN",
  "rio negro":                       "RN",
  "salta":                           "SA",
  "san juan":                        "SJ",
  "san luis":                        "SL",
  "santa cruz":                      "SC",
  "santa fe":                        "SF",
  "santiago del estero":             "SE",
  "tierra del fuego":                "TF",
  "tucumán":                         "TU",
  "tucuman":                         "TU",
};

function toProvinceCode(name: string): string {
  if (!name) return "";
  // Si ya parece un código corto (≤4 chars), devolverlo en mayúsculas
  if (name.trim().length <= 4) return name.trim().toUpperCase();
  const key = name.trim().toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "") // quitar tildes
    .replace(/[^a-z\s]/g, "").trim();
  return PROVINCE_CODE[key] ?? PROVINCE_CODE[name.trim().toLowerCase()] ?? name.trim().slice(0, 2).toUpperCase();
}

// Rate limiting: 10 requests por minuto por IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();

  // Purga de entradas vencidas para que el Map no crezca sin límite.
  if (rateLimitMap.size > 1000) {
    for (const [key, value] of rateLimitMap) {
      if (now > value.resetAt) rateLimitMap.delete(key);
    }
  }

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
  const { cp_destino, city_destino, state_destino, cart_items, subtotal } = (body ?? {}) as {
    cp_destino?:    string;
    city_destino?:  string;
    state_destino?: string;
    cart_items?: Array<{ product_id: string; quantity: number }>;
    subtotal?:   number;
  };

  if (!cp_destino || !/^\d{4,5}$/.test(cp_destino.trim())) {
    return NextResponse.json(
      { options: [], error: "El código postal debe tener 4 o 5 dígitos." },
      { status: 400 }
    );
  }

  const cpOrigen     = process.env.ENVIADOR_ORIGIN_CP        ?? "2000";
  const cityOrigen   = process.env.ENVIADOR_ORIGIN_CITY      ?? "Rosario";
  const stateOrigen  = toProvinceCode(process.env.ENVIADOR_ORIGIN_STATE ?? "Santa Fe");
  const country      = process.env.ENVIADOR_COUNTRY          ?? "AR";
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
      cpDestino:    cp_destino.trim(),
      cityDestino:  (city_destino  ?? "").trim(),
      stateDestino: (state_destino ?? "").trim(),
      cpOrigen,
      cityOrigen,
      stateOrigen,
      country,
      peso,
      largo,
      ancho,
      alto,
      valorDeclarado: subtotal ?? 0,
    });
    if (options.length === 0) {
      return NextResponse.json({
        options: [],
        error: "No hay opciones de envío disponibles para ese código postal.",
      });
    }
    return NextResponse.json({ options });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[shipping/quote] error:", msg);
    return NextResponse.json({ options: [], error: msg }, { status: 200 });
  }
}
