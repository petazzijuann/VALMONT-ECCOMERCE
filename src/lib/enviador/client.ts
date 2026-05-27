// Envia.com API client — documentación: https://developers.envia.com/
// La API requiere especificar el carrier en cada request, por eso hacemos
// una llamada por transportista en paralelo y combinamos los resultados.

const ENVIA_API = "https://api.envia.com/ship/rate/";

const CARRIERS = [
  { id: "andreani",         name: "Andreani",        fallbackDays: "3-5 días hábiles" },
  { id: "correo-argentino", name: "Correo Argentino", fallbackDays: "5-7 días hábiles" },
] as const;

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
  stateDestino:   string;
  cpOrigen:       string;
  cityOrigen:     string;
  stateOrigen:    string;
  country:        string;
  peso:           number;
  largo:          number;
  ancho:          number;
  alto:           number;
  valorDeclarado: number;
}

async function fetchCarrierRate(
  carrier: typeof CARRIERS[number],
  params: QuoteParams,
  apiKey: string,
  markup: number,
): Promise<EnvioOption[]> {
  try {
    const res = await fetch(ENVIA_API, {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        origin: {
          postalCode: params.cpOrigen,
          city:       params.cityOrigen,
          state:      params.stateOrigen,
          country:    params.country,
        },
        destination: {
          postalCode: params.cpDestino,
          city:       params.cityDestino,
          state:      params.stateDestino,
          country:    params.country,
        },
        packages: [{
          content:        "Indumentaria",
          amount:         1,
          type:           "box",
          dimensions:     { length: params.largo, width: params.ancho, height: params.alto },
          declared_value: params.valorDeclarado,
          weight:         params.peso,
        }],
        shipment: { carrier: carrier.id, type: 1 },
      }),
      signal: AbortSignal.timeout(10000),
    });

    const bodyText = await res.text();

    if (!res.ok) {
      console.warn(`[enviador:${carrier.id}] HTTP ${res.status}: ${bodyText.slice(0, 300)}`);
      return [];
    }

    let body: unknown;
    try { body = JSON.parse(bodyText); } catch {
      console.warn(`[enviador:${carrier.id}] JSON parse error`);
      return [];
    }

    console.log(`[enviador:${carrier.id}] response:`, JSON.stringify(body).slice(0, 600));

    const bodyObj = body as Record<string, unknown>;
    if (bodyObj.meta === "error") {
      console.warn(`[enviador:${carrier.id}] API error:`, (bodyObj.error as Record<string, unknown>)?.message);
      return [];
    }

    const tarifas: Record<string, unknown>[] = Array.isArray(body)
      ? (body as Record<string, unknown>[])
      : (((body as { data?: unknown[] }).data ?? []) as Record<string, unknown>[]);

    return tarifas.map((item) => {
      const precio  = Number(item.totalPrice ?? item.total_price ?? item.price ?? item.amount ?? 0);
      const diasRaw = String(item.deliveryEstimatedDate ?? item.delivery_estimated_date ?? item.days ?? item.estimatedDays ?? "").trim();
      return {
        carrier_id:   carrier.id,
        carrier_name: carrier.name,
        days_label:   diasRaw
          ? (/^\d/.test(diasRaw) ? `${diasRaw} días hábiles` : diasRaw)
          : carrier.fallbackDays,
        cost:       Math.ceil(precio * (1 + markup / 100)),
        service_id: String(item.serviceId ?? item.service_id ?? item.service ?? ""),
      };
    });
  } catch (err) {
    console.warn(`[enviador:${carrier.id}] fetch error:`, err);
    return [];
  }
}

export async function cotizarEnviocom(params: QuoteParams): Promise<EnvioOption[]> {
  const apiKey = process.env.ENVIADOR_API_KEY;
  if (!apiKey) throw new Error("ENVIADOR_API_KEY no configurada");

  const markup = parseFloat(process.env.ENVIADOR_MARKUP_PERCENT ?? "0");

  const results = await Promise.all(
    CARRIERS.map((carrier) => fetchCarrierRate(carrier, params, apiKey, markup))
  );

  return results.flat().sort((a, b) => a.cost - b.cost);
}
