---
titulo: Fix botones del navbar en versión mobile
proyecto: VALMONT E-commerce
estado: completado
fecha: 2026-05-21
agente: claude
prioridad: alta
estimacion: 4h
---

## Objetivo
Corregir el funcionamiento de los botones del navbar en mobile (carrito, hamburguesa y buscador si aplica), asegurando que respondan correctamente al touch, que el drawer del carrito no permita scroll del fondo, y que los z-index no generen conflictos entre componentes.

## Contexto
El navbar tiene tres botones de acción: carrito (`ShoppingBag`), hamburguesa (`Menu/X`) y —próximamente— buscador. En mobile estos botones presentan problemas de funcionamiento. Los archivos involucrados son:

- `src/components/public/Navbar.tsx` — botones del header
- `src/components/public/CartDrawer.tsx` — drawer del carrito (`z-50`, overlay `z-40`)
- `src/store/cart.ts` — Zustand store con `persist`
- `src/app/(public)/layout.tsx` — donde están montados Navbar y CartDrawer

## Causas identificadas

**1. Touch targets demasiado pequeños**
Los botones tienen `p-2` de padding. Con un ícono de 22px, el área táctil total es ~38×38px. El mínimo recomendado en mobile es 44×44px (guía de Apple y Google). En pantallas pequeñas o con dedos más grandes, el tap falla o activa el elemento equivocado.

**2. Sin scroll lock cuando el carrito está abierto**
Cuando el `CartDrawer` está abierto, el fondo sigue siendo scrolleable. En mobile esto es especialmente problemático: el usuario intenta scrollear el contenido del drawer y en cambio mueve el body, lo que genera una experiencia confusa y puede "enterrar" el drawer.

**3. Posible hydration mismatch con Zustand persist**
El navbar hace `const count = totalItems()` directamente en render. Como `useCartStore` usa `persist`, el store se rehidrata desde localStorage DESPUÉS del primer render. En SSR/SSG, el count es 0 (sin localStorage), pero en cliente puede ser distinto. Esto puede causar un error de hidratación que en algunos casos React resuelve re-renderizando, pero en mobile puede manifestarse como botones que "no responden" porque el componente se está re-montando.

**4. Z-index sin jerarquía clara**
El overlay del carrito tiene `z-40`, el drawer `z-50`, el navbar `z-50`. El popup de suscripción (spec 01) usa el `Dialog` de shadcn que por defecto tiene `z-50` también. Sin una jerarquía explícita, en mobile puede haber elementos invisibles con `pointer-events` activos bloqueando los botones del navbar.

**5. Body no marcado como interactivo en iOS**
En iOS Safari, elementos con `onClick` que no son `<a>` o `<button>` nativos a veces no reciben eventos touch. Los botones del navbar SÍ son `<button>`, así que esto no aplica directamente, pero el overlay del drawer es un `<div>` con `onClick` — si ese div se vuelve invisible pero sigue en el DOM con `pointer-events` activos, bloquea.

## Comportamiento esperado después del fix

**Botones del navbar:**
- Todos los botones del navbar tienen área táctil mínima de 44×44px
- El toque en el ícono del carrito abre el CartDrawer correctamente en mobile
- El toque en el hamburger abre/cierra el menú mobile correctamente
- No hay delay perceptible entre el tap y la respuesta visual

**CartDrawer en mobile:**
- Cuando el drawer está abierto, el `<body>` tiene `overflow: hidden` — el fondo no scrollea
- Al cerrar el drawer (X, overlay, o link), se restaura `overflow: auto` en el body
- El drawer ocupa el ancho completo en mobile (`w-full`, sin max-w-sm en pantallas muy pequeñas < 390px)
- El scroll interno del drawer (lista de items) funciona con touch/swipe sin mover el body

**Contador del carrito:**
- El badge con el número de items no causa hydration mismatch
- Usa `useEffect` + `useState` local para leer el count del store solo en cliente, nunca en SSR

**Z-index ordenado (de mayor a menor prioridad):**
```
z-50 → Navbar (sticky, siempre encima)
z-50 → CartDrawer (drawer del carrito)
z-40 → Overlay del carrito
z-40 → Dropdown de categorías (spec 09)
z-30 → Popup de suscripción (Dialog de shadcn)
z-20 → Buscador dropdown (spec 06)
```

**Menú hamburguesa:**
- Cada link en el menú mobile cierra el menú al ser tocado (`onClick={() => setMenuOpen(false)}`) — ya está implementado para TIENDA, verificar que se aplique a todos los links futuros (CONTACTO, subcategorías)

## Inputs
No aplica

## Outputs
No aplica

## Stack técnico para este feature
- Lenguaje: TypeScript
- Framework: Next.js 16 (App Router)
- UI: Tailwind CSS 4
- Estado: Zustand (`useCartStore`), `useState` local en Navbar
- Sin librerías nuevas

## Restricciones y reglas
- No cambiar la estructura del store Zustand ni los nombres de las funciones — solo el componente que las consume
- El scroll lock debe hacerse con `document.body.style.overflow` dentro de un `useEffect` en `CartDrawer.tsx`, con cleanup al desmontar
- El fix del hydration del count: usar `useMounted` pattern — renderizar el badge solo después de que el componente esté montado en el cliente
- No aumentar los touch targets usando `width/height` fijos — usar padding extra (`p-3` en lugar de `p-2`) para mantener el ícono centrado
- Los z-index se deben revisar en TODOS los componentes que usan `fixed` o `absolute`: Navbar, CartDrawer, EmailSubscriptionPopup, y los futuros SearchDropdown y dropdown de categorías
- El `Dialog` de shadcn/ui (usado en el popup de suscripción) tiene su propio z-index interno. Revisar en `src/components/ui/dialog.tsx` si existe y ajustarlo si es necesario

## Criterios de aceptación
- [ ] El botón del carrito abre el drawer en mobile al primer toque (sin necesidad de tocar dos veces)
- [ ] El botón hamburguesa abre/cierra el menú mobile correctamente
- [ ] El body no scrollea cuando el CartDrawer está abierto
- [ ] El scroll interno del CartDrawer funciona en touch
- [ ] El contador del carrito en el navbar no genera warning de hydration en consola
- [ ] Los z-index no generan conflictos visibles (ningún elemento invisible bloquea clicks/taps)
- [ ] El área táctil de cada botón es de al menos 44×44px (verificar en DevTools > mobile simulation)
- [ ] Al cerrar el drawer, el body vuelve a ser scrolleable
- [ ] Probado en iOS Safari y Android Chrome
- [ ] TypeScript sin errores

## Archivos a crear/modificar

**NO CREAR archivos nuevos**

**MODIFICAR:**
- `src/components/public/Navbar.tsx` — aumentar touch targets, fix hydration del count
- `src/components/public/CartDrawer.tsx` — scroll lock en body, ajuste de ancho en mobile
- `src/app/(public)/layout.tsx` — no debería necesitar cambios, pero verificar

## Cambios concretos por archivo

### `Navbar.tsx` — fix hydration del count

```tsx
// ANTES (problemático en SSR):
const count = totalItems()

// DESPUÉS (safe para SSR):
const [mounted, setMounted] = useState(false)
useEffect(() => setMounted(true), [])

// En el JSX del badge:
{mounted && count > 0 && (
  <span className="absolute -top-1 -right-1 bg-brand-cream text-brand-green text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
    {count}
  </span>
)}
```

### `Navbar.tsx` — touch targets

```tsx
// ANTES:
<button className="relative p-2 hover:text-white transition-colors">

// DESPUÉS (44px mínimo = p-3 da 24+22px = 46px):
<button className="relative p-3 hover:text-white transition-colors -m-1">
// El -m-1 compensa el padding extra para que no cambie el layout
```

### `CartDrawer.tsx` — scroll lock

```tsx
// Agregar este useEffect en CartDrawer:
useEffect(() => {
  if (isOpen) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
  return () => {
    document.body.style.overflow = ''
  }
}, [isOpen])
```

### `CartDrawer.tsx` — ancho en mobile muy pequeño

```tsx
// ANTES:
className="fixed top-0 right-0 h-full w-full max-w-sm ..."

// DESPUÉS (full width en mobile, max-sm en pantallas más grandes):
className="fixed top-0 right-0 h-full w-full sm:max-w-sm ..."
```

## Jerarquía de z-index a aplicar en todos los componentes

| Componente | z-index actual | z-index correcto |
|---|---|---|
| Navbar | `z-50` | `z-50` ✓ |
| CartDrawer (drawer) | `z-50` | `z-50` ✓ |
| CartDrawer (overlay) | `z-40` | `z-40` ✓ |
| Dialog shadcn (popup email) | shadcn default | revisar y fijar en `z-30` |
| Dropdown categorías (spec 09) | `z-40` propuesto | cambiar a `z-40` pero debajo del navbar |
| SearchDropdown (spec 06) | no implementado | `z-40` |

## Notas adicionales para el agente
- Testear con DevTools en modo mobile (iPhone SE, iPhone 14, Samsung Galaxy S21) antes de dar por terminado
- En iOS, el `document.body.style.overflow = 'hidden'` a veces no es suficiente — puede ser necesario agregar también `document.body.style.position = 'fixed'` y guardar el `scrollY` para restaurarlo al cerrar. Evaluar si es necesario según el resultado del test.
- La clase `-m-1` en los botones del navbar compensa visualmente el padding extra sin romper el layout flex existente
- Si el popup de suscripción (spec 01) ya está implementado, verificar en qué z-index está su `DialogOverlay` y `DialogContent` en el componente shadcn generado
- El `sm:max-w-sm` en el drawer mantiene el diseño en tablets/desktop (el drawer no ocupa todo el ancho en pantallas más grandes)
