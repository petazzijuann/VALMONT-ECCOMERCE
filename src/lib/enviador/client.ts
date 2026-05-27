// Envia.com API client — documentación: https://developers.envia.com/
// Agrega múltiples transportistas en una sola llamada. Solo se muestran Andreani y Correo Argentino.

const ENVIA_API = "https://api.envia.com/ship/rate/";
const ALLOWED_CARRIERS = ["andreani", "correo-argentino"];

export interface EnvioOption {
  carrier_id:   string;
  carrier_name: string;
  days_label:   string;
  cost:         number;
  service_id:   string;
}

export interface QuoteParams {
  cpDestino:      string;
  cpOrigen:       string;
  peso:           number;
  largo:          number;
  ancho:          number;
  alto:           number;
  valorDeclarado: number;
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
      origin:      { postal_code: params.cpOrigen },
      destination: { postal_code: params.cpDestino },
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
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) throw new Error(`Envia.com rate: HTTP ${res.status}`);

  const body = await res.json();
  const tarifas = Array.isArray(body)
    ? body
    : ((body as { data?: unknown[] }).data ?? []);

  return (tarifas as Record<string, unknown>[])
    .filter((item) => ALLOWED_CARRIERS.includes(String(item.carrier ?? "").toLowerCase()))
    .map((item) => {
      const carrierId = String(item.carrier ?? "").toLowerCase();
      const precio    = Number(item.totalPrice ?? item.price ?? 0);
      const dias      = String(item.deliveryEstimatedDate ?? "");
      return {
        carrier_id:   carrierId,
        carrier_name: carrierId === "andreani" ? "Andreani" : "Correo Argentino",
        days_label:   dias
          ? `${dias} días hábiles`
          : (carrierId === "andreani" ? "3-5 días hábiles" : "5-7 días hábiles"),
        cost:         Math.ceil(precio * (1 + markup / 100)),
        service_id:   String(item.serviceId ?? item.service_id ?? ""),
      };
    })
    .sort((a, b) => a.cost - b.cost);
}
