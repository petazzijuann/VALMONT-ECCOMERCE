---
titulo: Integración Andreani — cotización en carrito y generación automática de envío
proyecto: VALMONT E-commerce
estado: completado
fecha: 2026-05-22
agente: claude
prioridad: alta
estimacion: 3 días
---

## Objetivo
Integrar Andreani en el flujo de compra: el cliente ingresa su código postal en el carrito y obtiene cotizaciones en tiempo real (Estándar y Express), elige una opción que se suma al total, y al confirmar el pago el admin genera automáticamente la orden de envío en Andreani obteniendo el número de seguimiento.

## Contexto
El flujo actual de VALMONT es: carrito → checkout (datos personales + dirección) → `/api/orders` crea el pedido → admin confirma → `fulfillOrder` crea Sales y marca como confirmado. No hay cálculo de envío: el `total_amount` solo incluye el costo de los productos.

La integración agrega una nueva etapa entre el carrito y el checkout: la selección del tipo de envío con cotización real de Andreani.

**Documentación oficial:** https://dev.andreani.com/

## Flujo completo con Andreani

```
[CARRITO]
  └→ usuario ingresa CP destino
  └→ sistema cotiza en Andreani API (Origin CP: env var, Dest CP: ingresado)
  └→ muestra opciones: Estándar (X días, $Y) / Express (X días, $Y)
  └→ usuario selecciona una opción → se guarda en Zustand + se suma al total

[CHECKOUT]
  └→ muestra el envío seleccionado en el resumen (read-only)
  └→ el CP del carrito pre-llena el campo "CÓDIGO POSTAL" del formulario
  └→ el total incluye productos + envío
  └→ al confirmar → /api/orders recibe shipping_method y shipping_cost

[ADMIN CONFIRMA PAGO]
  └→ fulfillOrder llama a Andreani API para crear la orden de envío
  └→ guarda el andreani_tracking_id en el pedido
  └→ el admin ve el tracking en la tabla de pedidos
```

## Comportamiento esperado

---

### CARRITO — sección de envío (nueva)

La sección aparece en el panel derecho de resumen, **antes** del total y del botón "FINALIZAR COMPRA":

**Estado inicial:**
```
ENVÍO
[CÓDIGO POSTAL  ] [CALCULAR]
```
- Input de 4-5 dígitos, placeholder "Ej: 1043"
- Botón "CALCULAR" en estilo secundario (borde verde, texto verde)

**Estado loading (mientras cotiza):**
- Skeleton de 2 filas animado (pulse)
- Botón "CALCULANDO..." disabled

**Estado con opciones:**
```
ENVÍO
[CP: 1043] [cambiar]

◉ ANDREANI ESTÁNDAR
  3-5 días hábiles        $3.200

○ ANDREANI EXPRESS
  1-2 días hábiles        $5.800
```
- Radio buttons estilizados con la paleta VALMONT
- Opción seleccionada: borde verde, fondo verde/5
- Opción no seleccionada: borde `border-border`
- El total del resumen se actualiza instantáneamente al cambiar la selección

**Estado de error (CP inválido o API caída):**
- Mensaje: "No pudimos cotizar el envío para ese código postal. Intentá de nuevo."
- El botón "FINALIZAR COMPRA" sigue activo (el cliente puede continuar sin cotización si hay error)

**El resumen actualizado:**
```
Remera Oversize (M) ×1    $25.000
Pantalón Cargo (L)  ×1    $32.000
──────────────────────────────────
Subtotal                   $57.000
Envío Andreani Estándar     $3.200
──────────────────────────────────
TOTAL                      $60.200
```

---

### CHECKOUT — envío pre-seleccionado

- La sección "ENVÍO" aparece entre "DIRECCIÓN DE ENVÍO" y "MÉTODO DE PAGO"
- Muestra la opción seleccionada en el carrito (read-only si ya fue cotizada):
  ```
  ENVÍO SELECCIONADO
  [✓] Andreani Estándar · 3-5 días hábiles · $3.200
  ```
- El campo "CÓDIGO POSTAL" del formulario se pre-llena con el CP ingresado en el carrito
- Si el usuario cambia el CP en el checkout → el sistema ofrece recotizar:
  ```
  El código postal cambió. [RECOTIZAR]
  ```
- El resumen lateral muestra el total con envío incluido
- Si el usuario llega al checkout SIN haber seleccionado envío en el carrito → se muestra el selector de CP directamente en el checkout (misma lógica que el carrito)

---

### ADMIN — tabla de pedidos con tracking

- La tabla de pedidos (`OrdersTable.tsx`) muestra una nueva columna o campo: "ENVÍO"
- Cuando el pedido tiene `andreani_tracking_id`: muestra el número con link al tracking de Andreani
- Cuando no tiene tracking (envío no generado aún): muestra "—"
- El tipo de envío se muestra en el card del pedido: "Andreani Estándar · 3-5 días"

---

### FULFILLORDER — creación automática de orden en Andreani

Cuando el admin confirma el pago, después de crear los Sale records, se llama a Andreani para crear la orden de envío:
- Si el pedido tiene `shipping_method` de tipo Andreani (no retiro en local) → crear orden
- Si la creación falla → loguear el error pero NO fallar el fulfillOrder (el pago ya fue confirmado, el envío puede crearse manualmente)
- Si tiene éxito → guardar `andreani_tracking_id` y `andreani_order_id` en el pedido

---

## Campos nuevos en el modelo Order (Prisma)

```prisma
model Order {
  // ... campos existentes ...

  // Envío
  shipping_method      String?   // "andreani_standard" | "andreani_express" | "retiro_local"
  shipping_cost        Decimal?  @db.Decimal(12, 2)
  shipping_cp          String?   // código postal destino
  shipping_days_label  String?   // "3-5 días hábiles"

  // Andreani
  andreani_tracking_id String?
  andreani_order_id    String?
}
```

## Campos nuevos en el Zustand cart store

```ts
interface CartStore {
  // ... campos existentes ...
  shippingOption: ShippingOption | null
  shippingCp: string

  setShippingOption: (option: ShippingOption | null) => void
  setShippingCp: (cp: string) => void
  totalWithShipping: () => number
}

interface ShippingOption {
  type: "andreani_standard" | "andreani_express"
  label: string           // "Andreani Estándar"
  days_label: string      // "3-5 días hábiles"
  cost: number            // en pesos
}
```

## Inputs

### GET /api/shipping/quote?cp=1043
- `cp`: string, 4 dígitos (CP argentino)

### POST /api/orders (cambios)
Agregar al body existente:
```ts
shipping_method:     string | null
shipping_cost:       number | null
shipping_cp:         string | null
shipping_days_label: string | null
```

## Outputs

### GET /api/shipping/quote
```ts
{
  options: Array<{
    type: "andreani_standard" | "andreani_express"
    label: string
    days_label: string
    cost: number
  }>
}
```

## Stack técnico
- Lenguaje: TypeScript
- Framework: Next.js 16 (App Router)
- API externa: Andreani REST API (ver https://dev.andreani.com/ para endpoints actualizados)
- UI: Tailwind CSS 4, shadcn/ui (no se necesitan componentes nuevos de shadcn)
- Estado: Zustand store (agregar `shippingOption` y `shippingCp`)
- Validación: Zod
- Base de datos: Prisma (agregar campos a Order)

## Variables de entorno necesarias

```env
# Andreani
ANDREANI_USERNAME=tu_usuario
ANDREANI_PASSWORD=tu_password
ANDREANI_CONTRACT=tu_numero_de_contrato
ANDREANI_ORIGIN_CP=1043           # CP del local/depósito de VALMONT
ANDREANI_PACKAGE_WEIGHT_KG=0.5   # peso estimado por paquete en kg
ANDREANI_API_BASE=https://apis.andreani.com
```

Agregar al `.env.example` también.

## Restricciones y reglas
- Crear `src/lib/andreani/client.ts` con todas las llamadas a la API de Andreani — NO poner fetch inline en las API routes
- El cliente de Andreani debe manejar la autenticación internamente (Basic Auth o Bearer Token según lo que requiera Andreani)
- El `shippingOption` en Zustand NO se persiste en localStorage (no tiene sentido persistir un precio cotizado) — excluirlo del `partialize` del persist middleware
- El `shippingCp` SÍ se puede persistir para comodidad del usuario
- El endpoint `/api/shipping/quote` es público (no requiere auth de Supabase)
- El endpoint debe tener rate limiting básico: máximo 10 requests por minuto por IP para no abusar la API de Andreani
- Si la API de Andreani está caída, el endpoint responde `{ options: [], error: "Servicio no disponible" }` con HTTP 200 (no 500) — el cliente muestra el mensaje de error amigable
- El `total_amount` en el Order debe ser `subtotal_productos + shipping_cost` — actualizar el cálculo en `/api/orders/route.ts`
- La creación de la orden en Andreani dentro de `fulfillOrder` debe ser asíncrona y con try/catch que no propague el error — el fulfillOrder principal no puede fallar por un error de Andreani
- Correr `npx prisma migrate dev --name add-andreani-shipping` después de modificar el schema

## Criterios de aceptación
- [ ] El input de CP en el carrito acepta solo números y 4-5 dígitos
- [ ] Al hacer clic en CALCULAR aparece el loading state
- [ ] Las opciones de Andreani aparecen con precio y días reales de la API
- [ ] Seleccionar una opción actualiza el total inmediatamente
- [ ] El total en el resumen muestra subtotal + envío por separado
- [ ] El CP y la opción seleccionada se mantienen al navegar al checkout
- [ ] El checkout muestra el envío pre-seleccionado y pre-llena el CP
- [ ] El `total_amount` del pedido en base de datos incluye el costo de envío
- [ ] Al confirmar el pago en admin, se crea la orden en Andreani automáticamente
- [ ] Si la creación en Andreani falla, el pedido igual queda como `payment_confirmed`
- [ ] El tracking ID aparece en la tabla de pedidos del admin
- [ ] TypeScript sin errores

## Archivos a crear/modificar

**CREAR:**
- `src/lib/andreani/client.ts` — cliente de la API de Andreani
- `src/app/api/shipping/quote/route.ts` — GET cotización

**MODIFICAR:**
- `src/store/cart.ts` — agregar `shippingOption`, `shippingCp`, `setShippingOption`, `setShippingCp`, `totalWithShipping`
- `src/app/(public)/carrito/page.tsx` — agregar sección de envío
- `src/app/(public)/checkout/page.tsx` — mostrar envío seleccionado, pre-llenar CP, incluir shipping en submit
- `src/app/api/orders/route.ts` — recibir y guardar campos de envío, calcular total con shipping
- `src/lib/orders/fulfill.ts` — llamar a Andreani al confirmar pago
- `src/components/admin/OrdersTable.tsx` — mostrar tracking y tipo de envío
- `prisma/schema.prisma` — agregar campos de envío y Andreani al modelo Order
- `.env.example` — agregar variables de Andreani

## Diseño visual — Sección de envío en carrito

```
┌─────────────────────────────────────┐
│  RESUMEN                            │
│                                     │
│  Remera (M) ×1          $25.000    │
│  ─────────────────────────────────  │
│  Subtotal                $25.000    │
│                                     │
│  ENVÍO                              │
│  [1043              ] [CALCULAR]   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │◉ ANDREANI ESTÁNDAR         │   │ ← borde verde, fondo verde/5
│  │  3-5 días hábiles  $3.200  │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │○ ANDREANI EXPRESS          │   │
│  │  1-2 días hábiles  $5.800  │   │
│  └─────────────────────────────┘   │
│                                     │
│  ─────────────────────────────────  │
│  TOTAL                   $28.200    │
│                                     │
│  [ FINALIZAR COMPRA ]               │
└─────────────────────────────────────┘
```

## Cliente de Andreani (estructura base)

```ts
// src/lib/andreani/client.ts

const BASE = process.env.ANDREANI_API_BASE!
const auth  = Buffer.from(
  `${process.env.ANDREANI_USERNAME}:${process.env.ANDREANI_PASSWORD}`
).toString("base64")

const headers = {
  Authorization: `Basic ${auth}`,
  "Content-Type": "application/json",
  "x-contrato": process.env.ANDREANI_CONTRACT!,
}

export async function cotizarEnvio(cpDestino: string, pesoKg: number) {
  // Ver documentación Andreani para endpoint y body exactos
  // https://dev.andreani.com/
  const res = await fetch(`${BASE}/v1/tarifas`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      cpOrigen:  process.env.ANDREANI_ORIGIN_CP,
      cpDestino,
      pesoBruto: pesoKg,
      volumen:   { alto: 5, ancho: 20, largo: 30 }, // dimensiones típicas ropa
      contrato:  process.env.ANDREANI_CONTRACT,
    }),
  })
  if (!res.ok) throw new Error(`Andreani cotizar: ${res.status}`)
  return res.json()
}

export async function crearOrdenEnvio(order: {
  id: string
  customer_name: string
  customer_address: { street: string; city: string; province: string; zip: string }
  shipping_method: string
  total_amount: number
  items: Array<{ name: string; qty: number }>
}) {
  // Ver documentación Andreani para endpoint y body exactos
  const res = await fetch(`${BASE}/v1/envios`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      // mapear los campos del order al formato que pide Andreani
      // el agente debe revisar la documentación para el formato exacto
    }),
  })
  if (!res.ok) throw new Error(`Andreani crear envío: ${res.status}`)
  return res.json() as Promise<{ numeroEnvio: string; etiqueta?: string }>
}
```

## Notas adicionales para el agente
- **IMPORTANTE**: Los endpoints y el formato del body de la API de Andreani pueden cambiar. El agente DEBE leer la documentación en https://dev.andreani.com/ antes de implementar `cotizarEnvio` y `crearOrdenEnvio`. La estructura base en este spec es orientativa.
- El `shippingOption` en el Zustand store se puede excluir del persist con: `partialize: (state) => ({ items: state.items, shippingCp: state.shippingCp })`
- El peso del paquete se calcula como: `items.length * parseFloat(process.env.ANDREANI_PACKAGE_WEIGHT_KG!)` — asume un peso fijo por item
- Para el radio button estilizado: usar un `<input type="radio">` oculto con un `<div>` visible encima, controlado por clase condicional según el `shippingOption.type` seleccionado
- En la tabla de pedidos del admin, el tracking link puede ser: `https://www.andreani.com/#!/informacionEnvio/${trackingId}`
- El `total_amount` en `/api/orders/route.ts` actualmente se calcula sumando `items.reduce(...)`. Agregar `+ (shipping_cost ?? 0)` al final
- Si el usuario no seleccionó envío y hace clic en "FINALIZAR COMPRA", el checkout debe funcionar igual (shipping_cost = null, shipping_method = null) — el envío es opcional a nivel técnico, aunque en la UI se recomienda antes de continuar
