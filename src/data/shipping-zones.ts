export interface ShippingZone {
  label:     string;
  sucursal:  number;
  domicilio: number;
}

// Precios base por 1 unidad estándar (50×30×5 cm, 500 g).
// El costo total escala multiplicando por cantidad de unidades en el carrito.
const ZONES: Array<{ min: number; max: number; zone: ShippingZone }> = [
  { min:    0, max: 1999, zone: { label: "Buenos Aires / CABA", sucursal:  9200, domicilio: 12700 } },
  { min: 2000, max: 3599, zone: { label: "Centro / Litoral",    sucursal:  9300, domicilio: 12700 } },
  { min: 3600, max: 4799, zone: { label: "NOA / Noreste",       sucursal: 10450, domicilio: 14300 } },
  { min: 4800, max: 9499, zone: { label: "Cuyo / Patagonia",    sucursal: 11780, domicilio: 15300 } },
];

export function lookupZone(cp: string): ShippingZone | null {
  const n = parseInt(cp, 10);
  if (isNaN(n)) return null;
  return ZONES.find((z) => n >= z.min && n <= z.max)?.zone ?? null;
}
