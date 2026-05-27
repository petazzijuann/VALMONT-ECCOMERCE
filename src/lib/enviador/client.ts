// Envia.com API client — documentación: https://developers.envia.com/

const ENVIA_API = "https://api.envia.com/ship/rate/";

const ANDREANI_KEYS = ["andreani"];
const CORREO_KEYS   = ["correo-argentino", "correoargentino", "correo argentino", "correo"];

export interface EnvioOption {
  carrier_id:   string;
  carrier_name: string;
  days_label:   string;
  cost:         number;
  service_id:   string;
}

export interface QuoteParams {
  cpDestino:      string;
  cityDestino:    string;
  cpOrigen:       string;
  cityOrigen:     string;
  peso:           number;
  largo:          number;
  ancho:          number;
  alto:           number;
  valorDeclarado: number;
}

function resolveCarrier(item: Record<string, unknown>): { id: string; name: string } | null {
  const raw = String(
    item.carrier ?? item.carrier_id ?? item.carrierId ?? item.provider ?? ""
  ).toLowerCase().trim();

  if (!raw) return null;
  if (ANDREANI_KEYS.some((k) => raw.includes(k))) return { id: "andreani",         name: "Andreani" };
  if (CORREO_KEYS.some((k)  => raw.includes(k))) return { id: "correo-argentino", name: "Correo Argentino" };
  return null;
}

export async function cotizarEnviocom(params: QuoteParams): Promise<EnvioOption[]> {
  const apiKey = process.env.ENVIADOR_API_KEY;
  if (!apiKey) throw new Error("ENVIADOR_API_KEY no configurada");

  const markup = parseFloat(process.env.ENVIADOR_MARKUP_PERCENT ?? "0");

  const res = await fetch(ENVIA_API, {
    method:  "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      origin: {
        postal_code: params.cpOrigen,
        city:        params.cityOrigen,
      },
      destination: {
        postal_code: params.cpDestino,
        city:        params.cityDestino,
      },
      packages: [{
        content:        "Indumentaria",
        amount:         1,
        type:           "box",
        dimensions:     { length: params.largo, width: params.ancho, height: params.alto },
        declared_value: params.valorDeclarado,
        weight:         params.peso,
      }],
      shipment: { carrier: "", type: 1 },
    }),
    signal: AbortSignal.timeout(10000),
  });

  const bodyText = await res.text();

  if (!res.ok) {
    console.error(`[enviador] HTTP ${res.status} — body: ${bodyText}`);
    throw new Error(`Envia.com rate: HTTP ${res.status} — ${bodyText.slice(0, 200)}`);
  }

  let body: unknown;
  try { body = JSON.parse(bodyText); } catch {
    console.error("[enviador] JSON parse error — body:", bodyText.slice(0, 500));
    throw new Error("Envia.com: respuesta no es JSON");
  }

  console.log("[enviador] raw response:", JSON.stringify(body).slice(0, 1000));

  // Si la respuesta es un error JSON (meta: "error")
  const bodyObj = body as Record<string, unknown>;
  if (bodyObj.meta === "error") {
    const msg = (bodyObj.error as Record<string, unknown>)?.message ?? "Error de Envia.com";
    console.error("[enviador] API error:", msg);
    throw new Error(String(msg));
  }

  const tarifas: Record<string, unknown>[] = Array.isArray(body)
    ? (body as Record<string, unknown>[])
    : (((body as { data?: unknown[] }).data ?? []) as Record<string, unknown>[]);

  console.log(`[enviador] tarifas count: ${tarifas.length}, carriers: ${tarifas.map((t) => t.carrier ?? t.carrier_id ?? t.carrierId ?? t.provider).join(", ")}`);

  const results: EnvioOption[] = [];

  for (const item of tarifas) {
    const carrier = resolveCarrier(item);
    if (!carrier) continue;

    const precio  = Number(item.totalPrice ?? item.total_price ?? item.price ?? item.amount ?? 0);
    const diasRaw = item.deliveryEstimatedDate ?? item.delivery_estimated_date ?? item.days ?? item.estimatedDays ?? "";
    const dias    = String(diasRaw).trim();

    results.push({
      carrier_id:   carrier.id,
      carrier_name: carrier.name,
      days_label:   dias
        ? (/^\d/.test(dias) ? `${dias} días hábiles` : dias)
        : (carrier.id === "andreani" ? "3-5 días hábiles" : "5-7 días hábiles"),
      cost:       Math.ceil(precio * (1 + markup / 100)),
      service_id: String(item.serviceId ?? item.service_id ?? item.service ?? ""),
    });
  }

  return results.sort((a, b) => a.cost - b.cost);
}
