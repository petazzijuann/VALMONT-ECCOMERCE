---
titulo: Variantes de color por producto (selector, imágenes y stock por color)
proyecto: VALMONT E-commerce
estado: borrador
fecha: 2026-05-25
agente: claude
prioridad: alta
estimacion: 3 días
---

## Objetivo
Agregar soporte de variantes de color a los productos: cada color tiene sus propias imágenes y stock por talle, el cliente elige el color en la página de producto y ve las fotos de ese color, y el bot de Telegram permite definir colores al crear y agregar nuevos colores a productos existentes.

## Contexto
Actualmente cada producto tiene un único campo `images: string[]` y `stock: Record<string, number>` (talle → cantidad). Si un producto existe en dos colores hay que crear dos productos distintos. Este feature unifica eso en variantes de color dentro del mismo producto.

**Estructura actual de stock:** `{ "XS": 5, "S": 3, "M": 8, "L": 2 }`
**Estructura nueva (por color):** `{ "negro": { "XS": 5, "S": 3 }, "rojo": { "XS": 2, "M": 4 } }`

## Modelo de datos — nueva estructura

### Campo nuevo en Prisma: `color_variants`

```prisma
model Product {
  // ... campos existentes sin cambios ...

  // Nuevo campo
  color_variants Json @default("[]")
  // Tipo: ColorVariant[]
}
```

### Tipo TypeScript

```ts
// src/types/index.ts — agregar

export interface ColorVariant {
  name:   string                    // "negro", "rojo", "verde"
  images: string[]                  // URLs de Cloudinary para este color
  stock:  Record<string, number>    // { "XS": 5, "S": 3, "M": 8 }
}
```

### Regla de lectura (backward compatibility)

```
Si color_variants.length > 0  → usar color_variants para imágenes y stock
Si color_variants.length === 0 → usar images y stock originales del producto (productos sin migrar)
```

### Migración de productos existentes

Todos los productos actuales se migran a UN color llamado `"Único"` usando sus imágenes y stock actuales:

```ts
// Script de migración — correr UNA SOLA VEZ
// src/scripts/migrate-color-variants.ts

const products = await prisma.product.findMany()
for (const p of products) {
  if ((p.color_variants as ColorVariant[]).length > 0) continue // ya migrado
  await prisma.product.update({
    where: { id: p.id },
    data: {
      color_variants: [{
        name:   "Único",
        images: p.images,
        stock:  p.stock,
      }],
    },
  })
}
```

## Comportamiento esperado

---

### PÁGINA DE PRODUCTO

**Si el producto tiene UN solo color ("Único"):**
- No se muestra el selector de color (comportamiento igual al actual)
- Las imágenes y el stock vienen del `color_variants[0]`

**Si el producto tiene MÁS DE UN color:**
- Debajo del nombre y precio aparece el selector de color:
  ```
  COLOR: NEGRO

  [NEGRO]  [ROJO]  [VERDE]
  ```
  - Botones estilo igual que los talles actuales (`label-tag`, borde, hover)
  - Color activo: `bg-brand-green text-brand-cream border-brand-green`
  - El label "COLOR: [nombre]" se actualiza al seleccionar
- Al seleccionar un color:
  - La galería de imágenes (`ImageGallery`) carga las imágenes de ese color
  - Los botones de talle se actualizan con el stock de ese color (talles sin stock: apariencia tachada)
  - El color queda pre-seleccionado al agregar al carrito

**Al agregar al carrito:**
- Si hay colores: el `CartItem` incluye `color: string`
- Si no hay colores (producto "Único" migrado): `color: null` o `"Único"` (no mostrar en UI)

**Display en carrito:**
- Si `color !== null && color !== "Único"`: mostrar "Talle M · Color: NEGRO"
- Si `color` es null o "Único": mostrar solo "Talle M" (comportamiento actual)

---

### BOT DE TELEGRAM — nuevo flujo de creación con colores

#### Flujo completo nuevo

```
/nuevo
  → foto(s) ← pueden mandar varias fotos seguidas
  → nombre
  → categoría [keyboard]
  → "¿Tiene variantes de color?"
        [Un solo color]  [Varios colores]

--- RAMA: Un solo color ---
  → stock ("S:2 M:3 L:5")
  → precio venta
  → precio costo
  → descripción
  → vista previa + [Confirmar / Cancelar]

--- RAMA: Varios colores ---
  → "¿Cómo se llama el primer color? (ej: negro, rojo, verde)"
  → "Enviá las fotos para ese color"
       [foto 1] [foto 2] ... → [Listo, siguiente]
  → "Stock para [COLOR]: (ej: S:2 M:3 L:5)"
  → "¿Agregar otro color?"
        [Sí, agregar]  [No, listo]
  
  Si "Sí": repetir bucle (nombre → fotos → stock → ¿otro?)
  Si "No":
  → precio venta (único para todos los colores)
  → precio costo
  → descripción
  → vista previa con resumen de colores + [Confirmar / Cancelar]
```

#### Vista previa multi-color en Telegram

```
*Vista previa del producto:*

📌 *Remera Logo*
🏷 Categoría: remeras
🎨 Colores:
  ⚫ negro — S:3 M:5 L:2
  🔴 rojo  — S:2 M:3 L:0
💰 Venta: $25.000
🔒 Costo: $12.000 _(margen 52%)_
📝 _Remera 100% algodón..._
```

---

### BOT DE TELEGRAM — agregar color a producto existente

**Nuevo comando: `/addcolor`**

```
/addcolor
  → "¿A qué producto querés agregar un color? Buscá por nombre."
  → [usuario escribe nombre parcial]
  → [bot muestra lista de productos como botones inline]
  → usuario elige el producto
  → "¿Cómo se llama el nuevo color?"
  → "Enviá las fotos para [COLOR]"
       [foto 1] [foto 2] ... → [Listo, siguiente]
  → "Stock para [COLOR]: (ej: S:2 M:3 L:5)"
  → vista previa: "Agregar color ROJO al producto 'Remera Logo'"
        Stock: S:2 M:3
        X fotos
  → [Confirmar / Cancelar]
  → Si confirma: agregar el color variant al product.color_variants en DB
```

---

### ADMIN — EditProductSheet con colores

La sección de stock del `EditProductSheet` (spec 07) cambia:

**Si tiene 1 color "Único":**
- Mostrar igual que antes: mini-tabla con talles y cantidades

**Si tiene múltiples colores:**
- Mostrar un tab o sección por color:
  ```
  NEGRO          ROJO           VERDE
  XS [5] S [3]  XS [2] S [0]  XS [1] S [4]
  M  [8] L [2]  M  [4] L [3]  M  [0] L [0]
  XL [1]        XL [0]        XL [2]
  ```
- Editar stock por talle de cada color
- No permite agregar/quitar colores desde el admin web (eso se hace por Telegram con `/addcolor`)
- Botón "VER FOTOS" por color → abre un modal simple mostrando las imágenes de ese color

---

## Cambios en tipos TypeScript

### `src/types/index.ts`

```ts
// Agregar:
export interface ColorVariant {
  name:   string
  images: string[]
  stock:  Record<string, number>
}

// Actualizar ProductPublic:
export interface ProductPublic {
  // ... campos existentes ...
  color_variants: ColorVariant[]
}

// Actualizar CartItem:
export interface CartItem {
  // ... campos existentes ...
  color: string | null
}
```

## Cambios en el Zustand store

El `CartItem` agrega `color`. La lógica de `addItem` y `removeItem` debe considerar `color` además de `product_id` y `size`:

```ts
// El uniqueKey de un item es: product_id + size + color
const existing = state.items.find(
  i => i.product_id === newItem.product_id &&
       i.size === newItem.size &&
       i.color === newItem.color
)
```

## Nuevos estados del bot (state.ts)

```ts
export type BotState =
  // ... estados existentes ...
  | "upload_waiting_color_decision"
  | "upload_waiting_color_name"
  | "upload_waiting_color_photos"
  | "upload_waiting_color_stock"
  | "upload_color_asking_more"
  // nuevos para /addcolor:
  | "addcolor_waiting_search"
  | "addcolor_waiting_product_choice"
  | "addcolor_waiting_name"
  | "addcolor_waiting_photos"
  | "addcolor_waiting_stock"
  | "addcolor_confirming"

// Actualizar UploadData:
export interface UploadData {
  // ... campos existentes ...
  has_colors?:      boolean
  current_color?:   string           // color siendo cargado en este momento
  current_photos?:  string[]         // fotos del color actual
  color_variants?:  ColorVariant[]   // colores ya cargados
}

// Nuevo tipo:
export interface AddColorData {
  product_id?:    string
  product_name?:  string
  color_name?:    string
  photos?:        string[]
  stock?:         Record<string, number>
}
// Y agregar addColorData? a BotSessionData
```

## Manejo de múltiples fotos en Telegram

El bot actual recibe UNA foto y avanza al siguiente estado. Para colores necesitamos MÚLTIPLES fotos antes de avanzar. Solución: en el estado `upload_waiting_color_photos`, cada foto recibida se acumula en `current_photos`. El usuario envía un mensaje de texto "listo" para indicar que terminó de enviar fotos.

```
Estado: upload_waiting_color_photos
  → si llega foto: subir a Cloudinary, agregar a current_photos[], responder "Foto X recibida. Enviá más o escribí LISTO."
  → si llega texto "LISTO": avanzar a upload_waiting_color_stock
  → si current_photos está vacío y el usuario escribe LISTO: pedir al menos una foto
```

## Stack técnico
- Lenguaje: TypeScript
- Framework: Next.js 16 (App Router)
- UI: Tailwind CSS 4 (botones de color iguales a los de talle)
- Bot: Telegraf (ya instalado)
- Base de datos: Prisma (campo `color_variants Json` en Product)
- Estado: Zustand (agregar `color` a `CartItem`)

## Restricciones y reglas
- El campo `images` y `stock` originales del producto NO se eliminan — se mantienen para backward compatibility hasta que el equipo decida migrar completamente
- Después de la migración, `color_variants[0]` es la fuente de verdad para imágenes y stock
- La selección de color en la página de producto es un Client Component — `AddToCartSection` ya lo es
- El selector de color se muestra SOLO si `color_variants.length > 1`
- El primer color de `color_variants` se pre-selecciona al cargar la página
- En el admin `EditProductSheet`, los cambios de stock por color deben enviar el `color_variants` completo actualizado en el body del PUT
- El endpoint `PUT /api/admin/products/[id]` (spec 07) debe aceptar `color_variants` en el body y guardarlo
- El script de migración se corre UNA SOLA VEZ con `npx ts-node src/scripts/migrate-color-variants.ts` — agregar un check para no re-migrar productos ya migrados
- `prefers-reduced-motion`: no aplica directamente a este feature (no hay animaciones nuevas)

## Criterios de aceptación
- [ ] Productos con un color no muestran el selector (igual que hoy)
- [ ] Productos con múltiples colores muestran botones de color debajo del precio
- [ ] Seleccionar un color actualiza la galería de imágenes
- [ ] Seleccionar un color actualiza los talles disponibles (stock de ese color)
- [ ] El carrito guarda el color seleccionado y lo muestra si no es "Único"
- [ ] El checkout muestra el color en el resumen de ítems
- [ ] El pedido en la base de datos guarda el color en el campo `items`
- [ ] La migración convierte todos los productos existentes a 1 color "Único"
- [ ] El bot de Telegram pregunta por colores al crear un producto
- [ ] El bot permite subir múltiples fotos por color y avanzar con "LISTO"
- [ ] `/addcolor` agrega un color nuevo a un producto existente correctamente
- [ ] El admin `EditProductSheet` muestra el stock por color y permite editarlo
- [ ] TypeScript sin errores

## Archivos a crear/modificar

**CREAR:**
- `src/scripts/migrate-color-variants.ts` — script de migración one-time
- `src/lib/telegram/handlers/add-color.ts` — handler del comando `/addcolor`

**MODIFICAR:**
- `prisma/schema.prisma` — agregar `color_variants Json` al modelo Product
- `src/types/index.ts` — agregar `ColorVariant`, actualizar `ProductPublic` y `CartItem`
- `src/lib/telegram/state.ts` — agregar nuevos BotState y actualizar UploadData
- `src/lib/telegram/handlers/upload-product.ts` — agregar flujo de colores
- `src/lib/telegram/bot.ts` — registrar el comando `/addcolor`
- `src/components/public/AddToCartSection.tsx` — agregar selector de color
- `src/components/public/ImageGallery.tsx` — aceptar `images` como prop dinámica (ya las acepta por prop, verificar)
- `src/store/cart.ts` — agregar `color` a `CartItem`, actualizar lógica de deduplicación
- `src/app/(public)/producto/[slug]/page.tsx` — pasar `color_variants` a los componentes cliente
- `src/components/admin/EditProductSheet.tsx` — mostrar y editar stock por color
- `src/app/api/admin/products/[id]/route.ts` — aceptar `color_variants` en PUT

## Diseño visual — selector de color en página de producto

```
REMERAS
REMERA LOGO OVERSIZE
$25.000

COLOR: NEGRO

[NEGRO]  [ROJO]  [VERDE]
←── mismo estilo que los talles

TALLE:
[XS] [S] [M] [L] [XL] ← stock del color NEGRO

[AGREGAR AL CARRITO]
```

## Flujo de Telegram — multi-foto por color (detalle)

```
Bot: "Enviá las fotos para NEGRO (podés mandar varias). Cuando termines escribí LISTO."

Usuario: [envía foto 1]
Bot: "📷 Foto 1 recibida. Seguí enviando o escribí LISTO."

Usuario: [envía foto 2]
Bot: "📷 Foto 2 recibida. Seguí enviando o escribí LISTO."

Usuario: "listo"
Bot: "✅ 2 fotos para NEGRO guardadas.
📦 Stock para NEGRO: (ej: S:2 M:3 L:5)"

Usuario: "S:3 M:5 L:2"
Bot: "Stock guardado: S: 3 | M: 5 | L: 2

¿Agregar otro color?"
[✅ Sí, agregar otro]  [🏁 No, listo]
```

## Notas adicionales para el agente
- La `ImageGallery` en `producto/[slug]/page.tsx` recibe `images={product.images}`. Con colores, debe recibir el estado del color seleccionado. La solución: convertir `ImageGallery` en un componente que recibe `images` como prop y que `AddToCartSection` (o un nuevo wrapper) controle qué imágenes mostrar según el color seleccionado — el estado del color seleccionado debe vivir en el componente padre que engloba galería + selector
- Para la vista previa en Telegram con múltiples colores, mostrar un emoji de círculo por color aproximado: negro→⚫, blanco→⚪, rojo→🔴, verde→🟢, azul→🔵, amarillo→🟡, naranja→🟠, otros→🎨
- El `PUT /api/admin/products/[id]` actualmente recibe campos planos. Al agregar `color_variants`, incluirlo como campo opcional en el schema Zod de validación del servidor
- Correr `npx prisma migrate dev --name add-color-variants` después de modificar el schema
- El script de migración necesita importar Prisma directamente y correr con `npx ts-node --project tsconfig.json src/scripts/migrate-color-variants.ts`
- El estado del color seleccionado en la página de producto NO va en Zustand — es estado local de la página (no necesita persistir entre navegaciones)
