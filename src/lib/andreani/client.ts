// Andreani REST API client
// Documentación: https://dev.andreani.com/
// Verificar endpoints y formato de body con las credenciales reales antes de usar en producción.

const BASE = process.env.ANDREANI_API_BASE ?? "https://apis.andreani.com";

function getHeaders() {
  const user = process.env.ANDREANI_USERNAME;
  const pass = process.env.ANDREANI_PASSWORD;
  const contract = process.env.ANDREANI_CONTRACT;

  if (!user || !pass || !contract) {
    throw new Error("Faltan variables de entorno de Andreani (USERNAME, PASSWORD, CONTRACT)");
  }

  const auth = Buffer.from(`${user}:${pass}`).toString("base64");
  return {
    Authorization: `Basic ${auth}`,
    "Content-Type": "application/json",
    "x-contrato": contract,
  };
}

export interface AndreaniQuoteItem {
  type: "andreani_standard" | "andreani_express";
  label: string;
  days_label: string;
  cost: number;
}

// Cotiza el envío entre el CP origen (del local) y el CP destino del cliente.
// El formato exacto del body y los campos de respuesta pueden variar según la versión
// de la API. Revisar con las credenciales reales en https://dev.andreani.com/
export async function cotizarEnvio(cpDestino: string, pesoKg: number): Promise<AndreaniQuoteItem[]> {
  const cpOrigen  = process.env.ANDREANI_ORIGIN_CP;
  const contract  = process.env.ANDREANI_CONTRACT;

  const res = await fetch(`${BASE}/v2/tarifas`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      cpOrigen,
      cpDestino,
      contrato: contract,
      pesoBruto: pesoKg,
      volumen: { alto: 5, ancho: 20, largo: 30 },
    }),
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) {
    throw new Error(`Andreani cotizar: HTTP ${res.status}`);
  }

  const data = await res.json();

  // Mapear la respuesta de Andreani al formato interno.
  // La estructura real depende de la versión de la API — ajustar según la respuesta real.
  // Ejemplo esperado: array de tarifas con tipo, precio y días.
  return mapQuoteResponse(data);
}

function mapQuoteResponse(data: unknown): AndreaniQuoteItem[] {
  // La API de Andreani devuelve algo como:
  // [ { modalidad: "Estándar", precio: 3200, diasHabiles: "3 a 5" }, ... ]
  // Ajustar este mapeo según la respuesta real obtenida con las credenciales.
  const tarifas = Array.isArray(data) ? data : (data as { tarifas?: unknown[] }).tarifas ?? [];

  const options: AndreaniQuoteItem[] = [];

  for (const t of tarifas as Record<string, unknown>[]) {
    const label = String(t.modalidad ?? t.nombre ?? t.tipo ?? "").toLowerCase();
    const cost  = Number(t.precio ?? t.costo ?? t.tarifa ?? 0);
    const dias  = String(t.diasHabiles ?? t.dias ?? "");

    if (label.includes("express") || label.includes("urgente")) {
      options.push({
        type: "andreani_express",
        label: "Andreani Express",
        days_label: dias ? `${dias} días hábiles` : "1-2 días hábiles",
        cost,
      });
    } else {
      options.push({
        type: "andreani_standard",
        label: "Andreani Estándar",
        days_label: dias ? `${dias} días hábiles` : "3-5 días hábiles",
        cost,
      });
    }
  }

  return options;
}

export interface AndreaniOrderInput {
  orderId: string;
  customerName: string;
  customerAddress: { street: string; city: string; province: string; zip: string };
  shippingMethod: string;
  totalAmount: number;
  items: Array<{ name: string; qty: number }>;
}

export interface AndreaniOrderResult {
  trackingId: string;
  andreaniOrderId: string;
}

// Crea la orden de envío en Andreani al confirmar el pago.
// El endpoint y el formato del body pueden variar — revisar en https://dev.andreani.com/
export async function crearOrdenEnvio(input: AndreaniOrderInput): Promise<AndreaniOrderResult> {
  const contract = process.env.ANDREANI_CONTRACT;
  const cpOrigen = process.env.ANDREANI_ORIGIN_CP;

  const res = await fetch(`${BASE}/v2/ordenes-de-envio`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      contrato:  contract,
      remitente: { codigoPostal: cpOrigen },
      destinatario: {
        nombreCompleto: input.customerName,
        email: "",
        direccion: {
          calle:       input.customerAddress.street,
          localidad:   input.customerAddress.city,
          provincia:   input.customerAddress.province,
          codigoPostal: input.customerAddress.zip,
        },
      },
      bultos: [{
        kilos:  parseFloat(process.env.ANDREANI_PACKAGE_WEIGHT_KG ?? "0.5"),
        alto:   5,
        ancho:  20,
        largo:  30,
        valorDeclarado: input.totalAmount,
        descripcion: input.items.map((i) => `${i.name} x${i.qty}`).join(", "),
      }],
      referencias: [input.orderId],
    }),
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    throw new Error(`Andreani crear orden: HTTP ${res.status}`);
  }

  const data = await res.json() as { numeroEnvio?: string; id?: string; trackingNumber?: string };

  return {
    trackingId:      data.numeroEnvio ?? data.trackingNumber ?? "",
    andreaniOrderId: data.id ?? "",
  };
}
