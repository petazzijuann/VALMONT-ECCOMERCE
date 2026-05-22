---
titulo: Dropdown de categorías en navbar al hover sobre TIENDA
proyecto: VALMONT E-commerce
estado: completado
fecha: 2026-05-21
agente: claude
prioridad: alta
estimacion: 4h
---

## Objetivo
Mostrar un menú desplegable animado con las categorías de productos cuando el usuario posa el mouse sobre el link "TIENDA" en el navbar, permitiendo ir directo a una categoría sin pasar por la página general; si hace clic directo sobre "TIENDA", navega a `/tienda` sin filtro.

## Contexto
El navbar actual tiene un solo link "TIENDA" que lleva a `/tienda` general. No hay forma de ir directamente a una categoría desde la navegación principal. Este feature agrega esa posibilidad con un dropdown tipo mega-menu minimalista, coherente con el estilo VALMONT.

Feature relacionado: `06-buscador-navbar.md` (mismo archivo `Navbar.tsx`, misma lógica de estado)

## Comportamiento esperado

**Desktop — hover sobre TIENDA:**
- El usuario posa el mouse sobre el link "TIENDA" (sin hacer clic)
- Después de un delay de 80ms (para evitar triggers accidentales), aparece el dropdown
- El dropdown se anima: `opacity: 0 → 1` + `translateY: -8px → 0`, duration 0.2s, ease-out
- El link "TIENDA" recibe un estilo activo mientras el dropdown está visible: `text-white` en lugar de `text-cream-dark`

**Contenido del dropdown:**
- Fondo: `#1b3022` (brand-green), mismo color que el navbar
- Borde inferior y laterales: `1px solid #2d4a35` (green-mid)
- Lista de categorías con sus links:
  - REMERAS → `/tienda?categoria=remeras`
  - PANTALONES → `/tienda?categoria=pantalones`
  - BUZOS → `/tienda?categoria=buzos`
  - ACCESORIOS → `/tienda?categoria=accesorios`
  - CALZADO → `/tienda?categoria=calzado`
- Separador visual (línea `border-t border-green-mid`) y al final:
  - VER TODO → `/tienda` (link especial que lleva al general)
- Cada item del dropdown:
  - Tipografía `label-tag` en `text-cream-dark`
  - Padding: `px-6 py-3`
  - Hover: `text-brand-cream bg-green-mid/50 transition-colors duration-150`
  - Sin bordes entre items (el espacio en blanco los separa visualmente)

**Cierre del dropdown:**
- El mouse sale del área combinada (link TIENDA + dropdown) → dropdown cierra con animación inversa (`opacity: 1→0`, `translateY: 0→-4px`, duration: 0.15s)
- Usar un timeout de 100ms antes de cerrar para que el usuario pueda mover el mouse desde el link hacia el dropdown sin que se cierre
- Hacer clic en cualquier categoría → navegar y cerrar
- Presionar Escape → cerrar el dropdown

**Clic directo sobre "TIENDA":**
- Si el usuario hace clic en el texto "TIENDA" (no en una categoría del dropdown) → navegar a `/tienda` sin filtro, como antes
- El dropdown también se cierra al hacer clic

**Mobile (< 768px):**
- En mobile no hay hover — el dropdown no aplica
- En el menú hamburguesa, agregar las categorías como sub-links debajo de TIENDA:
  ```
  TIENDA
    └ REMERAS
    └ PANTALONES
    └ BUZOS
    └ ACCESORIOS
    └ CALZADO
  ```
- Las subcategorías están siempre visibles cuando el menú mobile está abierto (no hace falta un segundo toggle)
- Estilo de subcategorías: `pl-6` (sangría), `text-xs`, `text-cream-dark/70`, `py-1.5`

## Inputs
No aplica (navegación pura)

## Outputs
No aplica (navegación pura)

## Stack técnico para este feature
- Lenguaje: TypeScript
- Framework: Next.js 16 (App Router)
- UI: Tailwind CSS 4 + Lucide (ningún ícono nuevo necesario)
- Animación: CSS transition (`opacity`, `transform`) controlado por clase condicional — sin GSAP
- Estado: `useState(isOpen: boolean)` local en `Navbar.tsx` (ya es Client Component)
- Navegación: `<Link>` de Next.js para las categorías

## Restricciones y reglas
- `Navbar.tsx` ya es Client Component — agregar el estado del dropdown directamente, sin componente wrapper extra
- El dropdown debe estar posicionado con `position: absolute` debajo del link TIENDA, con `top: 100%` y `left: 0` relativo al contenedor del link (que debe tener `position: relative`)
- El área de detección del hover debe incluir TANTO el link TIENDA como el dropdown en sí — usar `onMouseEnter`/`onMouseLeave` en el contenedor padre que los engloba
- El delay de apertura (80ms) y el delay de cierre (100ms): manejarlos con `useRef<ReturnType<typeof setTimeout>>` + `clearTimeout` para limpiar correctamente
- No usar librerías externas de dropdown (Radix DropdownMenu, Headless UI, etc.) — implementar custom para mantener el control del diseño
- El `z-index` del dropdown debe ser menor al del buscador expandido (ver spec 06) — usar `z-40`
- Al navegar a una categoría, el dropdown debe cerrarse inmediatamente (no esperar la animación de cierre)
- Las categorías en el dropdown deben ser exactamente las mismas que en la página `/tienda`: remeras, pantalones, buzos, accesorios, calzado — definirlas en una constante compartida si es posible

## Criterios de aceptación
- [ ] El dropdown aparece con animación al hacer hover sobre TIENDA en desktop
- [ ] El dropdown NO aparece si el mouse apenas pasa por encima (delay de 80ms)
- [ ] El mouse puede moverse desde TIENDA hasta el dropdown sin que se cierre
- [ ] Hacer clic en "TIENDA" directo navega a `/tienda` sin filtro
- [ ] Cada categoría en el dropdown navega a `/tienda?categoria=X` correctamente
- [ ] "VER TODO" en el dropdown navega a `/tienda`
- [ ] El dropdown cierra al salir del área con animación suave
- [ ] El dropdown cierra al presionar Escape
- [ ] En mobile, las subcategorías aparecen bajo TIENDA en el menú hamburguesa
- [ ] El link TIENDA muestra estado activo mientras el dropdown está visible
- [ ] TypeScript sin errores

## Archivos a crear/modificar

**NO CREAR archivos nuevos — todo va en el Navbar existente**

**MODIFICAR:**
- `src/components/public/Navbar.tsx` — agregar estado del dropdown, lógica de hover con delays, y JSX del dropdown y subcategorías mobile

## Diseño visual

### Desktop — dropdown cerrado
```
[VALMONT]    [TIENDA]    [🔍] [🛒]
```

### Desktop — dropdown abierto (hover)
```
[VALMONT]    [TIENDA ▾]    [🔍] [🛒]
             ┌─────────────┐
             │ REMERAS     │
             │ PANTALONES  │
             │ BUZOS       │
             │ ACCESORIOS  │
             │ CALZADO     │
             │─────────────│
             │ VER TODO →  │
             └─────────────┘
             fondo: #1b3022
             borde: #2d4a35
```

### Mobile — menú hamburguesa abierto
```
┌─────────────────────────────────┐
│  TIENDA                         │
│    REMERAS                      │  ← pl-6, text-xs, cream-dark/70
│    PANTALONES                   │
│    BUZOS                        │
│    ACCESORIOS                   │
│    CALZADO                      │
│                                 │
│  CONTACTO                       │  ← si ya existe de spec 05
└─────────────────────────────────┘
```

## Lógica de hover con delays (pseudocódigo)

```tsx
const openTimer  = useRef<ReturnType<typeof setTimeout>>()
const closeTimer = useRef<ReturnType<typeof setTimeout>>()
const [isOpen, setIsOpen] = useState(false)

function handleMouseEnter() {
  clearTimeout(closeTimer.current)
  openTimer.current = setTimeout(() => setIsOpen(true), 80)
}

function handleMouseLeave() {
  clearTimeout(openTimer.current)
  closeTimer.current = setTimeout(() => setIsOpen(false), 100)
}

// En el JSX — el contenedor padre engloba tanto el link como el dropdown:
<div
  className="relative hidden md:block"
  onMouseEnter={handleMouseEnter}
  onMouseLeave={handleMouseLeave}
>
  <Link href="/tienda" onClick={() => setIsOpen(false)}>
    TIENDA
  </Link>

  {/* Dropdown */}
  <div className={`absolute top-full left-0 z-40 min-w-[160px]
    transition-all duration-200 ease-out
    ${isOpen
      ? "opacity-100 translate-y-0 pointer-events-auto"
      : "opacity-0 -translate-y-2 pointer-events-none"
    }`}
  >
    {/* items de categoría */}
  </div>
</div>
```

## Constante de categorías (compartida)

```tsx
// Definir dentro de Navbar.tsx o importar desde un archivo compartido
// si la tienda/page.tsx también la usa

const CATEGORIAS = [
  { value: "remeras",    label: "REMERAS" },
  { value: "pantalones", label: "PANTALONES" },
  { value: "buzos",      label: "BUZOS" },
  { value: "accesorios", label: "ACCESORIOS" },
  { value: "calzado",    label: "CALZADO" },
] as const
```

## Notas adicionales para el agente
- El `pointer-events-none` en el dropdown cerrado es clave — evita que el dropdown invisible intercepte clicks cuando está oculto
- La animación de cierre (`opacity-0 -translate-y-2`) es más sutil que la de apertura (`-translate-y-2 → 0`) — esto es intencional para que la apertura se sienta más "viva" y el cierre más discreto
- El `▾` en el link TIENDA cuando el dropdown está abierto: puede implementarse con un `ChevronDown` de Lucide con `transition-transform rotate-0/rotate-180`, o simplemente con un carácter `▾` condicional
- Escape key: `useEffect` con `document.addEventListener('keydown', e => { if (e.key === 'Escape') setIsOpen(false) })` + cleanup
- En mobile, las subcategorías no necesitan animación de apertura/cierre — siempre visibles cuando el menú hamburguesa está abierto
- Verificar que el `z-index` del dropdown (`z-40`) no quede por encima del buscador expandido del spec 06 si ambos están abiertos al mismo tiempo — el buscador debe ganar
