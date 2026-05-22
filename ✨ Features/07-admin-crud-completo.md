---
titulo: CRUD completo en panel de admin (editar y eliminar)
proyecto: VALMONT E-commerce
estado: completado
fecha: 2026-05-21
agente: claude
prioridad: alta
estimacion: 2 días
---

## Objetivo
Agregar las acciones faltantes en el panel de admin: eliminar pedidos, eliminar ventas, y editar + eliminar productos, todo con dialogs de confirmación para evitar borrados accidentales.

## Contexto
El admin actual tiene estas operaciones:
- Productos: solo PUBLICAR/DESPUBLICAR (`PATCH /api/admin/products/[id]` con `is_published`)
- Pedidos: solo CONFIRMAR/RECHAZAR (`PATCH /api/admin/orders/[id]` con `action`)
- Ventas: solo listar y exportar CSV

Faltan completamente: editar producto, eliminar producto, eliminar pedido, eliminar venta.

## Comportamiento esperado

---

### 1. ELIMINAR PRODUCTO

**En la tabla de productos:**
- Agregar botón "ELIMINAR" en la columna de acciones de cada fila, junto al existente PUBLICAR/DESPUBLICAR
- El botón tiene estilo: borde rojo `text-valmont-error border-valmont-error hover:bg-valmont-error/10`
- Al hacer clic → abre un `AlertDialog` de shadcn/ui con:
  - Título: "¿Eliminar producto?"
  - Descripción: "Esta acción no se puede deshacer. El producto '[nombre]' será eliminado permanentemente."
  - Botones: "CANCELAR" (outline) y "ELIMINAR" (rojo, destructivo)
- Al confirmar: `DELETE /api/admin/products/[id]`
  - Si el producto tiene ventas asociadas → la API responde 409 con error: "Este producto tiene ventas registradas y no puede eliminarse"
  - Si no tiene ventas → elimina y responde `{ ok: true }`
- Después de eliminar: `mutate()` para refrescar la tabla, toast de confirmación: "Producto eliminado"

---

### 2. EDITAR PRODUCTO

**En la tabla de productos:**
- Agregar botón "EDITAR" en la columna de acciones, antes de PUBLICAR y ELIMINAR
- El botón tiene estilo: borde verde `border-brand-green text-brand-green hover:bg-brand-green/10`
- Al hacer clic → abre un `Sheet` (panel deslizante desde la derecha) de shadcn/ui con el formulario

**Formulario de edición (dentro del Sheet):**
- Título del Sheet: "EDITAR PRODUCTO"
- Campos editables:
  - `name`: Input texto, requerido
  - `description`: Textarea, opcional
  - `category`: Select con las opciones: remeras, pantalones, buzos, accesorios, calzado
  - `price_sale`: Input número, requerido, mínimo 0
  - `price_cost`: Input número, requerido, mínimo 0
  - `stock`: Mini-tabla con una fila por talle (XS, S, M, L, XL, XXL) y un Input numérico por cada uno
  - `tags`: Input de texto separado por comas, se convierte a array al guardar
  - `is_published`: Switch (toggle)
- Campos NO editables: `slug` (mostrar como texto readonly con nota "El slug no se puede cambiar para preservar URLs"), `images` (fuera del scope de este feature)
- Validación con Zod antes de enviar (mismo esquema en cliente y servidor)
- Botón "GUARDAR CAMBIOS": `PUT /api/admin/products/[id]`
  - En loading: texto "GUARDANDO..." + disabled
  - En éxito: cierra el Sheet, `mutate()`, toast: "Producto actualizado"
  - En error: muestra mensaje de error dentro del Sheet sin cerrarlo
- Botón "CANCELAR": cierra el Sheet sin guardar

---

### 3. ELIMINAR PEDIDO

**En las cards de pedidos:**
- Agregar botón "ELIMINAR PEDIDO" solo para pedidos con status `pending_payment` o `cancelled`
- Para pedidos con status `payment_confirmed`, `shipped`, o `delivered` → NO mostrar el botón de eliminar (esos pedidos tienen ventas registradas)
- Al hacer clic → `AlertDialog` con:
  - Título: "¿Eliminar pedido?"
  - Descripción: "El pedido #[id corto] de [nombre cliente] será eliminado. Esta acción no se puede deshacer."
  - Botones: "CANCELAR" y "ELIMINAR"
- Al confirmar: `DELETE /api/admin/orders/[id]`
  - La API solo permite eliminar si el status es `pending_payment` o `cancelled`, rechaza con 409 si no
  - Si era `pending_payment`: liberar el stock reservado (llamar a `releaseStock` antes de borrar)
  - Responde `{ ok: true }` en éxito
- Después: `mutate()`, toast: "Pedido eliminado"

---

### 4. ELIMINAR VENTA

**En la tabla de ventas:**
- Agregar una columna vacía al final de los headers actuales
- En cada fila: botón ícono de basura (`Trash2` de Lucide, size 14) sin texto, con tooltip "Eliminar venta"
- Estilo: `text-muted-foreground hover:text-valmont-error transition-colors`
- Al hacer clic → `AlertDialog` con:
  - Título: "¿Eliminar esta venta?"
  - Descripción: "Se eliminará el registro de venta de '[producto]' del [fecha]. Esta acción no restaura el stock."
  - Botones: "CANCELAR" y "ELIMINAR"
- Al confirmar: `DELETE /api/admin/sales/[id]`
  - La eliminación de una venta NO restaura stock (es un registro histórico, no afecta inventario)
  - Responde `{ ok: true }`
- Después: `mutate()`, toast: "Venta eliminada"

---

## Inputs

### PUT /api/admin/products/[id]
```ts
{
  name:        string (min 1)
  description: string (opcional)
  category:    "remeras" | "pantalones" | "buzos" | "accesorios" | "calzado"
  price_sale:  number (> 0)
  price_cost:  number (> 0)
  stock:       Record<"XS"|"S"|"M"|"L"|"XL"|"XXL", number>
  tags:        string[]
  is_published: boolean
}
```

### DELETE /api/admin/products/[id]
Sin body.

### DELETE /api/admin/orders/[id]
Sin body.

### DELETE /api/admin/sales/[id]
Sin body.

## Outputs

Todos los DELETE exitosos: `{ ok: true }` (HTTP 200)
Todos los DELETE con conflicto: `{ error: string }` (HTTP 409)
PUT exitoso: el objeto producto actualizado serializado

## Stack técnico para este feature
- Lenguaje: TypeScript
- Framework: Next.js 16 (App Router)
- UI: shadcn/ui (`AlertDialog`, `Sheet`, `Input`, `Textarea`, `Select`, `Switch`, `Button`, `Label`) + Tailwind CSS 4 + Lucide (`Trash2`, `Pencil`)
- Estado: `useState` local en cada componente de tabla
- Data fetching: SWR ya instalado (`useSWR` + `mutate`) — no cambiar
- Validación: Zod (cliente en formulario + servidor en API)
- Base de datos: Prisma

## Restricciones y reglas
- El `AlertDialog` debe ser un componente genérico reutilizable `DeleteConfirmDialog.tsx` que recibe `title`, `description`, `onConfirm` como props — no copiar el mismo JSX en 4 lugares
- El `Sheet` de edición de producto puede ser un componente dedicado `EditProductSheet.tsx`
- Los botones de acción nuevos van en la última columna de cada tabla, respetando el orden: EDITAR → PUBLICAR/DESPUBLICAR → ELIMINAR
- Las APIs de DELETE deben verificar que el recurso existe antes de eliminar (responder 404 si no existe)
- El DELETE de producto debe verificar si tiene `Sale` asociadas en Prisma antes de eliminar
- El DELETE de pedido debe verificar el status y llamar a `releaseStock` si era `pending_payment`
- Nunca eliminar una venta que no existe — verificar y responder 404
- Toast notifications: usar `sonner` si está instalado, sino usar el componente `Toast` de shadcn/ui

## Criterios de aceptación
- [ ] Botón EDITAR abre el Sheet con los datos del producto pre-cargados
- [ ] El formulario valida todos los campos antes de enviar
- [ ] Guardar cambios actualiza el producto y refresca la tabla
- [ ] Botón ELIMINAR en productos muestra el AlertDialog de confirmación
- [ ] Eliminar producto con ventas asociadas muestra error y no elimina
- [ ] Eliminar producto sin ventas lo borra correctamente y refresca la tabla
- [ ] En pedidos, el botón ELIMINAR solo aparece en pendientes y cancelados
- [ ] Eliminar pedido pendiente libera el stock correctamente
- [ ] El ícono de basura en ventas muestra el AlertDialog correcto
- [ ] Eliminar venta borra el registro sin modificar stock
- [ ] Todos los botones muestran estado de carga (disabled + "...") mientras procesan
- [ ] Toasts de confirmación o error aparecen después de cada acción
- [ ] TypeScript sin errores

## Archivos a crear/modificar

**CREAR:**
- `src/components/admin/DeleteConfirmDialog.tsx` — AlertDialog genérico de confirmación
- `src/components/admin/EditProductSheet.tsx` — Sheet con formulario de edición
- `src/app/api/admin/sales/[id]/route.ts` — DELETE para eliminar una venta

**MODIFICAR:**
- `src/app/api/admin/products/[id]/route.ts` — agregar handlers PUT (editar) y DELETE (eliminar)
- `src/app/api/admin/orders/[id]/route.ts` — agregar handler DELETE (eliminar)
- `src/components/admin/ProductsTable.tsx` — agregar botones EDITAR y ELIMINAR
- `src/components/admin/OrdersTable.tsx` — agregar botón ELIMINAR en pedidos válidos
- `src/components/admin/SalesTable.tsx` — agregar columna con ícono de eliminar

## Diseño visual

### Columna de acciones en ProductsTable (nueva)
```
[EDITAR]   [PUBLICAR / DESPUBLICAR]   [ELIMINAR]
 verde           estado actual           rojo
```

### OrdersTable — botón eliminar (solo en pending/cancelled)
```
┌──────────────────────────────────────────┐
│  Juan Pérez · +54 11...  PENDIENTE       │
│  #ABC12345 · 21/05/26 · transferencia   │
│                              $25.000     │
│  Remera Oversize (M) x1 — $25.000       │
│                                          │
│  [CONFIRMAR PAGO]  [RECHAZAR]            │
│  [ELIMINAR PEDIDO]  ← botón solo aquí   │
└──────────────────────────────────────────┘
```

### SalesTable — nueva columna (cabecera vacía)
```
FECHA | PRODUCTO | TALLE | U. | PRECIO | COSTO | MARGEN | CANAL | PAGO | [🗑]
```

### AlertDialog de confirmación
```
┌──────────────────────────────────┐
│  ¿Eliminar producto?             │
│                                  │
│  Esta acción no se puede         │
│  deshacer. El producto 'Remera   │
│  Oversize' será eliminado        │
│  permanentemente.                │
│                                  │
│  [CANCELAR]        [ELIMINAR]    │
│                     (rojo)       │
└──────────────────────────────────┘
```

### EditProductSheet
```
                    ┌────────────────────────┐
                    │  EDITAR PRODUCTO     ✕ │
                    │                        │
                    │  Nombre               │
                    │  [Remera Oversize    ] │
                    │                        │
                    │  Categoría            │
                    │  [Remeras          ▼] │
                    │                        │
                    │  Precio venta  Costo  │
                    │  [$25000 ]  [$12000 ] │
                    │                        │
                    │  Stock por talle       │
                    │  XS[0] S[2] M[5] L[3] │
                    │  XL[1] XXL[0]         │
                    │                        │
                    │  Tags (separados por ,)│
                    │  [oversize, negro    ] │
                    │                        │
                    │  Publicado  [●───]    │
                    │                        │
                    │  [CANCELAR] [GUARDAR] │
                    └────────────────────────┘
```

## Lógica de API — DELETE producto con validación

```ts
// src/app/api/admin/products/[id]/route.ts
export async function DELETE(req, { params }) {
  const { id } = await params

  const salesCount = await prisma.sale.count({ where: { product_id: id } })
  if (salesCount > 0) {
    return NextResponse.json(
      { error: "Este producto tiene ventas registradas y no puede eliminarse" },
      { status: 409 }
    )
  }

  await prisma.product.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
```

## Lógica de API — DELETE pedido con liberación de stock

```ts
// src/app/api/admin/orders/[id]/route.ts
export async function DELETE(req, { params }) {
  const { id } = await params

  const order = await prisma.order.findUnique({ where: { id } })
  if (!order) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

  const deletableStatuses = ["pending_payment", "cancelled"]
  if (!deletableStatuses.includes(order.status)) {
    return NextResponse.json(
      { error: "Solo se pueden eliminar pedidos pendientes o cancelados" },
      { status: 409 }
    )
  }

  if (order.status === "pending_payment") {
    await releaseStock(id) // libera el stock reservado
  }

  await prisma.order.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
```

## Notas adicionales para el agente
- `DeleteConfirmDialog` recibe: `open: boolean`, `onOpenChange: (v: boolean) => void`, `title: string`, `description: string`, `onConfirm: () => Promise<void>`, `loading: boolean`
- `EditProductSheet` recibe: `product: ProductAdmin | null`, `open: boolean`, `onOpenChange: (v: boolean) => void`, `onSaved: () => void` (llama a `mutate()` del padre)
- El campo de stock en el Sheet: iterar sobre `["XS", "S", "M", "L", "XL", "XXL"]` con un `Input type="number" min="0"` por cada uno, guardando en un objeto `Record<string, number>`
- Los tags: un solo `Input` con valor como string unido por ", " (`tags.join(", ")`), al guardar: `value.split(",").map(t => t.trim()).filter(Boolean)`
- Para el toast: verificar con `grep -r "sonner\|toast"` si ya está instalado; si no, usar shadcn `useToast`
- El `Sheet` de shadcn/ui ya incluye overlay y cierre con Escape — no agregar lógica extra para eso
- La columna de acciones en `ProductsTable` actualmente es la última con `""` como header — mantener ese header vacío y agregar los botones ahí
