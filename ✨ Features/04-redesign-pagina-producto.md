---
titulo: Rediseño página de producto con animaciones
proyecto: VALMONT E-commerce
estado: completado
fecha: 2026-05-21
agente: claude
prioridad: alta
estimacion: 1 día
---

## Objetivo
Rediseñar la página de detalle de producto (`/producto/[slug]`) para que la galería de imágenes, la información del producto y la selección de talle sean visualmente premium con animaciones GSAP que guíen la atención del usuario hacia la acción de compra.

## Contexto
La página de producto actual tiene el layout correcto (galería + info en 2 columnas) pero es completamente estática. En una tienda de moda premium, esta es la página más crítica para la conversión — tiene que comunicar calidad y urgencia.

Features relacionados: `02-redesign-pagina-inicio.md` (GSAP ya instalado), `03-redesign-pagina-tienda.md`

## Comportamiento esperado

**Al cargar la página:**
- Breadcrumb: fade in desde la izquierda (opacity 0→1, x: -20→0, duration: 0.5s)
- Galería (columna izquierda): revela desde abajo (y: 60→0, opacity 0→1, duration: 0.8s, ease: power2.out)
- Columna info (derecha): los elementos aparecen en stagger de arriba hacia abajo:
  1. Label de categoría (delay: 0.1s)
  2. Nombre del producto (delay: 0.2s, Bebas grande)
  3. Precio (delay: 0.3s, con count-up desde 0)
  4. Selector de talle (delay: 0.4s)
  5. Botón "Agregar al carrito" (delay: 0.5s, slide desde abajo)
  6. Descripción y tags (delay: 0.6s)

**Galería de imágenes (mejorar `ImageGallery.tsx`):**
- Imagen principal: transición cross-fade suave al cambiar (opacity 0→1, duration: 0.3s) en lugar de cambio instantáneo
- Miniaturas (thumbnails): hover con scale sutil (1→1.05) y borde verde que aparece con transición
- La imagen activa en thumbnails: borde izquierdo verde grueso (2px) con animación de entrada
- En mobile: swipe gesture horizontal para cambiar imagen (nativo o con GSAP Draggable si está disponible)

**Selector de talle:**
- Al hacer hover sobre un talle disponible: el background hace un fill de abajo hacia arriba (clip-path o pseudo-elemento)
- Talle sin stock: aparece con una línea diagonal tachada encima
- Al seleccionar un talle: escala briefly (scale: 1→1.1→1, duration: 0.2s) para confirmar la selección

**Botón "Agregar al carrito":**
- Estado idle: fondo `#1b3022`, texto crema
- Hover: el fondo crema hace un fill de izquierda a derecha (100ms), texto cambia a verde
- Al hacer clic: el botón muestra estado de loading (texto "AGREGANDO..." + spinner sutil) y luego confirmación ("✓ AGREGADO") por 1.5s antes de volver al estado original
- Esta animación reemplaza la lógica actual de `AddToCartSection.tsx`

**Sección de scroll (debajo del fold):**
- La descripción del producto entra con fade up al scrollear hacia ella
- Los tags entran con stagger desde la izquierda (cada uno con 0.05s de delay)

**Barra de compra sticky en mobile:**
- En pantallas mobile (< 768px), cuando el botón "Agregar al carrito" sale del viewport, aparece una barra sticky abajo con: nombre del producto, precio, y botón "AGREGAR"
- La barra entra con slide desde abajo (y: 100%→0, duration: 0.3s)
- La barra desaparece si el usuario vuelve a ver el botón original

## Inputs
- `params.slug`: string (slug del producto, resuelto server-side)
- Datos del producto vía Prisma (server component)

## Outputs
No aplica directamente (visualización), pero `AddToCartSection` modifica el estado Zustand del carrito

## Stack técnico para este feature
- Lenguaje: TypeScript
- Framework: Next.js 16 (App Router) — `ProductoPage` sigue siendo Server Component
- Animaciones: GSAP 3 + ScrollTrigger (ya instalado)
- Hook: `useGSAP` de `@gsap/react`
- UI: Tailwind CSS 4, shadcn/ui

## Restricciones y reglas
- `src/app/(public)/producto/[slug]/page.tsx` es Server Component — no modificar su naturaleza
- `ImageGallery.tsx` ya es Client Component — modificarlo directamente para agregar animaciones
- `AddToCartSection.tsx` ya es Client Component — modificarlo para el nuevo botón animado
- La barra sticky mobile: nuevo componente Client, usar Intersection Observer para detectar si el botón original es visible
- La línea diagonal de talles sin stock: implementar con CSS `background: linear-gradient(to top right, transparent calc(50% - 1px), #d4d4cc calc(50% - 1px), #d4d4cc calc(50% + 1px), transparent calc(50% + 1px))`
- No agregar librerías de swipe externas — si se implementa swipe, usar GSAP Draggable o touch events nativos
- `prefers-reduced-motion`: respetar en todas las animaciones

## Criterios de aceptación
- [ ] Las animaciones de entrada del hero de producto son fluidas y no hay layout shift
- [ ] La galería hace cross-fade al cambiar imagen
- [ ] El selector de talle tiene los estados visuales correctos (disponible, sin stock, activo)
- [ ] El botón de carrito tiene los 3 estados animados (idle, loading, confirmado)
- [ ] La barra sticky aparece en mobile cuando el botón sale del viewport
- [ ] Los tags entran con stagger al scrollear
- [ ] El precio hace count-up al cargar
- [ ] No rompe la funcionalidad del carrito (Zustand store)
- [ ] TypeScript sin errores

## Archivos a crear/modificar

**CREAR:**
- `src/components/public/StickyCartBar.tsx` — barra sticky mobile (Client Component)
- `src/components/public/ProductInfoAnimated.tsx` — wrapper animado para la columna de info (Client Component)

**MODIFICAR:**
- `src/components/public/ImageGallery.tsx` — agregar cross-fade y animaciones de thumbnail
- `src/components/public/AddToCartSection.tsx` — nuevo estado de botón animado
- `src/app/(public)/producto/[slug]/page.tsx` — integrar `ProductInfoAnimated` y `StickyCartBar`

## Diseño visual

### Layout desktop
```
┌──────────────────────┬───────────────────┐
│                      │ CATEGORIA         │
│  [imagen principal]  │ NOMBRE PRODUCTO   │
│                      │ $XX.XXX           │
│  ┌──┐ ┌──┐ ┌──┐     │                   │
│  │  │ │  │ │  │     │ [XS][S][M][L][XL] │
│  └──┘ └──┘ └──┘     │                   │
│  thumbnails          │ [AGREGAR CARRITO] │
│                      │                   │
│                      │ DESCRIPCIÓN       │
│                      │ texto...          │
│                      │                   │
│                      │ [tag] [tag] [tag] │
└──────────────────────┴───────────────────┘
```

### Barra sticky mobile
```
┌─────────────────────────────────────────┐
│  Nombre Producto        $XX.XXX         │
│                  [AGREGAR AL CARRITO]   │
└─────────────────────────────────────────┘  ← bottom: 0, sticky
```

### Estados del botón "Agregar al carrito"
```
Idle:        [ AGREGAR AL CARRITO ]   verde/crema
Hover:       [ AGREGAR AL CARRITO ]   fill crema→verde animado
Loading:     [ AGREGANDO...  ○ ]      mismo estilo, texto cambia
Confirmado:  [ ✓ AGREGADO ]           verde más oscuro, 1.5s luego vuelve
```

## Notas adicionales para el agente
- El cross-fade de imágenes en `ImageGallery`: mantener 2 elementos `<img>` superpuestos con `position: absolute`, alternar opacity con GSAP
- Para el fill del botón hover: usar `::before` pseudo-elemento con `scaleX: 0→1` o `clipPath`, CSS puro es suficiente aquí (no necesita GSAP)
- El count-up del precio: `gsap.from(obj, { val: 0, duration: 0.8, ease: "power1.out", onUpdate: () => setDisplayPrice(Math.round(obj.val)) })`
- La `StickyCartBar` debe recibir `product.name` y `product.price_sale` como props desde el Server Component padre
- La función de "agregar al carrito" del store Zustand debe llamarse tanto desde `AddToCartSection` como desde `StickyCartBar` — compartir la lógica, no duplicarla
