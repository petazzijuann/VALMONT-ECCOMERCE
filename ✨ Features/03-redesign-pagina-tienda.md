---
titulo: Rediseño página de tienda con animaciones
proyecto: VALMONT E-commerce
estado: completado
fecha: 2026-05-21
agente: claude
prioridad: alta
estimacion: 1 día
---

## Objetivo
Rediseñar la página `/tienda` para que la grilla de productos, los filtros y el header se sientan premium y dinámicos usando GSAP, manteniendo el filtrado por URL (server-side) y sin sacrificar performance.

## Contexto
La página de tienda actual funciona correctamente con filtros por categoría y talle via URL params. El problema es puramente visual: el header, filtros y grilla aparecen estáticos. El rediseño agrega animaciones de entrada, hover states y transiciones entre estados de filtro.

Feature relacionado: `02-redesign-pagina-inicio.md` (misma librería GSAP, mismo sistema de setup)

## Comportamiento esperado

**Al cargar la página (primera vez o cambio de filtro):**
- El contador de productos ("X PRODUCTOS") aparece con un count-up animado (0 → número real, duration: 0.8s)
- El título "TIENDA" se revela con clip-path de izquierda a derecha
- Los filtros de categoría entran en stagger desde la izquierda (cada chip con 0.06s de delay)
- Los filtros de talle entran igual, 0.1s después del último filtro de categoría
- Los product cards entran con stagger (grid completo, 0.1s entre cards, y: 40→0, opacity 0→1)

**Hover en product card:**
- La imagen escala suavemente (scale: 1→1.04, duration: 0.4s, ease: power1.out)
- El nombre del producto sube 2px (y: 0→-2, duration: 0.3s)
- Aparece un overlay muy sutil crema semitransparente sobre la imagen

**Al hacer clic en un filtro (navegación a nueva URL):**
- El filtro activo se marca visualmente (ya existe: bg-brand-green)
- Los cards actuales hacen fade out rápido (opacity 1→0, duration: 0.2s) antes de la navegación
- Al cargar los nuevos resultados, entran con el stagger habitual

**Estado vacío (sin productos para los filtros):**
- Un mensaje centrado aparece con fade: "Sin productos disponibles en esta categoría"
- Un botón "VER TODO" debajo

**Header sticky de scroll:**
- La barra de filtros se vuelve `sticky top-16` (debajo del navbar) al hacer scroll, con un borde inferior sutil y fondo blanco/crema
- Transición suave entre sticky y no-sticky con box-shadow

## Inputs
- `searchParams.categoria`: string opcional (nombre de categoría)
- `searchParams.talle`: string opcional (XS, S, M, L, XL, XXL)

## Outputs
No aplica (página de visualización)

## Stack técnico para este feature
- Lenguaje: TypeScript
- Framework: Next.js 16 (App Router) — página sigue siendo Server Component
- Animaciones: GSAP 3 + ScrollTrigger (ya instalado en feature 02)
- Hook: `useGSAP` de `@gsap/react`
- UI: Tailwind CSS 4, shadcn/ui

## Restricciones y reglas
- La página `src/app/(public)/tienda/page.tsx` es Server Component — no convertir
- El count-up y los stagger de cards van en un Client Component wrapper
- Los filtros son `<a>` tags con href (navegación full-page) — mantener así para SEO y funcionalidad
- El fade out al clickear filtro: agregar un event listener en los filtros que ejecuta la animación antes de que Next.js navegue
- La barra de filtros sticky: manejar con Intersection Observer o GSAP ScrollTrigger, no con scroll event listener manual
- `prefers-reduced-motion`: respetar, desactivar animaciones si está activo
- El `ProductGrid` existente (`src/components/public/ProductGrid.tsx`) puede envolverse en un wrapper animado sin modificarlo internamente

## Criterios de aceptación
- [ ] El count-up del número de productos funciona correctamente
- [ ] El stagger de cards se ejecuta al cargar y al cambiar filtros
- [ ] El hover en cards es suave y no hay jank
- [ ] Los filtros sticky funcionan en scroll sin parpadeo
- [ ] El estado vacío se muestra con animación
- [ ] Los filtros activos mantienen el estilo visual correcto
- [ ] Funciona correctamente en mobile (touch, scroll)
- [ ] TypeScript sin errores

## Archivos a crear/modificar

**CREAR:**
- `src/components/public/TiendaHeader.tsx` — header con count-up animado (Client Component)
- `src/components/public/FiltrosBarra.tsx` — filtros sticky con animación de entrada (Client Component)
- `src/components/public/AnimatedProductGrid.tsx` — si no se creó en feature 02, crearlo aquí

**MODIFICAR:**
- `src/app/(public)/tienda/page.tsx` — reemplazar JSX del header y filtros con los nuevos componentes, mantener fetch y lógica

## Diseño visual

### Layout general
```
┌─────────────────────────────────────────┐
│  [sticky navbar VALMONT]                │
├─────────────────────────────────────────┤
│  [sticky filtros al scrollear]          │
│  TODOS  REMERAS  PANTALONES  BUZOS...   │
│  TODOS  XS  S  M  L  XL  XXL           │
├─────────────────────────────────────────┤
│                                         │
│  12 PRODUCTOS          ←── label-tag    │
│  TIENDA                ←── Bebas 5xl   │
│                                         │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐  │
│  │      │ │      │ │      │ │      │  │
│  │ img  │ │ img  │ │ img  │ │ img  │  │
│  │      │ │      │ │      │ │      │  │
│  │ nom  │ │ nom  │ │ nom  │ │ nom  │  │
│  │ $$$  │ │ $$$  │ │ $$$  │ │ $$$  │  │
│  └──────┘ └──────┘ └──────┘ └──────┘  │
└─────────────────────────────────────────┘
```

### Hover en card
```
Normal:   imagen normal, nombre estático
Hover:    imagen escala 1.04, nombre sube 2px, overlay crema sutil
```

## Notas adicionales para el agente
- El count-up se puede implementar con GSAP: `gsap.to(obj, { val: targetNumber, onUpdate: () => setCount(Math.round(obj.val)) })`
- Para el fade-out antes de navegar al filtro: `document.querySelectorAll('.product-card')` + `gsap.to(...)` + callback con `router.push(href)` — NO usar `<a>` directo en ese caso, cambiar a `useRouter`
- Alternativa más simple para el fade entre filtros: usar `View Transitions API` de Next.js si la versión lo soporta
- El sticky de filtros: agregar clase con `position: sticky; top: 64px` (altura del navbar) y `z-index: 40`
- Referencia de timing: stagger de cards 0.08s, duration por card 0.5s, ease: `power2.out`
