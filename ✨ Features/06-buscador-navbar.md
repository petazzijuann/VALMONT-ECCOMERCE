---
titulo: Buscador de productos en navbar
proyecto: VALMONT E-commerce
estado: completado
fecha: 2026-05-21
agente: claude
prioridad: alta
estimacion: 1 día
---

## Objetivo
Agregar un buscador de productos en el navbar, a la izquierda del ícono del carrito, que muestre resultados en tiempo real mientras el usuario escribe y redirija a `/tienda?q=...` al presionar Enter.

## Contexto
Actualmente el navbar de VALMONT solo tiene el link "TIENDA" como navegación. Sin buscador, los usuarios que saben lo que quieren tienen que scrollear toda la tienda para encontrarlo. Este feature reduce la fricción de descubrimiento.

El navbar actual tiene este layout:
```
[VALMONT logo]         [TIENDA]         [🔍] [🛒] [☰]
```
El buscador va entre TIENDA y el carrito en desktop, y en el grupo de íconos de la derecha en mobile.

## Comportamiento esperado

**Ícono de búsqueda (estado inicial):**
- En desktop: ícono `Search` de Lucide a la izquierda del carrito
- En mobile: ícono `Search` en el grupo de acciones de la derecha (entre hamburguesa y carrito)
- Al hacer clic → el campo de búsqueda se expande animado (ver detalle abajo)

**Expansión del campo de búsqueda (desktop):**
- El input aparece con animación de width: 0 → 240px (duration: 0.25s, ease: ease-out)
- El input recibe focus automáticamente al expandirse
- Estilo: fondo `#2d4a35` (green-mid), texto crema, sin borde visible, placeholder "BUSCAR PRODUCTOS..."
- Presionar `Escape` → colapsa el input de vuelta a ícono (animación inversa)
- Hacer clic fuera del buscador (fuera del navbar) → colapsa
- El ícono de lupa cambia a `X` mientras el input está abierto para cerrarlo

**Expansión en mobile:**
- Al tocar el ícono de búsqueda → aparece una barra de búsqueda full-width debajo del navbar (no en línea con el navbar)
- La barra empuja el contenido hacia abajo (no es overlay)
- Misma lógica de cierre con `X` o Escape

**Dropdown de resultados (mientras escribe):**
- Aparece debajo del input en desktop / debajo de la barra en mobile
- Se dispara con debounce de 300ms después de que el usuario escribe
- Muestra máximo 5 resultados
- Cada resultado muestra: thumbnail (40×40px), nombre del producto, precio
- Al final del dropdown: link "Ver todos los resultados para '[query]'" → navega a `/tienda?q=query`
- Si no hay resultados: mensaje "Sin resultados para '[query]'"
- Si está cargando: 3 skeletons con animación pulse
- Hacer clic en un resultado → navega a `/producto/[slug]` y cierra el buscador

**Redirección con Enter:**
- Al presionar Enter → navega a `/tienda?q=[query]` y cierra el buscador

**Página de tienda con búsqueda (`/tienda?q=...`):**
- La búsqueda por texto `q` se aplica como filtro adicional a los existentes (categoría + talle)
- El header muestra: "X RESULTADOS PARA 'query'" en lugar de "X PRODUCTOS"
- Los productos se filtran por: nombre, descripción y tags (case-insensitive, búsqueda parcial)
- Si hay `q` activo, los filtros de categoría y talle siguen funcionando y se combinan con `q`
- Un botón "✕ Limpiar búsqueda" aparece cerca del header para quitar el filtro `q`

## Inputs — API de búsqueda
- `q`: string, mínimo 2 caracteres, máximo 100 caracteres

## Outputs — API de búsqueda
```ts
// GET /api/search?q=remera
{
  results: Array<{
    id: string
    name: string
    slug: string
    price_sale: number
    images: string[]   // solo el primer elemento
    category: string
  }>
  total: number
}
```

## Stack técnico para este feature
- Lenguaje: TypeScript
- Framework: Next.js 16 (App Router)
- UI: shadcn/ui (no hay un componente específico — construir custom) + Tailwind CSS 4 + Lucide (`Search`, `X`)
- Animación: CSS transition (width, opacity) — no necesita GSAP para esto
- Estado: `useState` local en el componente Navbar (ya es Client Component)
- Debounce: implementar manualmente con `useRef` + `setTimeout`/`clearTimeout`, sin librerías extra
- Base de datos: Prisma con `contains` + `mode: 'insensitive'` para búsqueda parcial

## Restricciones y reglas
- `Navbar.tsx` ya es Client Component — agregar el estado del buscador ahí directamente, no crear un componente wrapper extra
- El dropdown de resultados sí puede ser un componente separado `SearchDropdown.tsx` para mantener el Navbar legible
- La API `/api/search` es pública (no requiere auth) — proteger contra queries vacíos o muy cortos en el servidor
- Mínimo 2 caracteres para disparar la búsqueda (no hacer fetch por cada tecla desde el primer caracter)
- El endpoint debe responder en menos de 300ms — limitar a 5 resultados máximos con `take: 5` en Prisma
- Accesibilidad: el input debe tener `aria-label="Buscar productos"`, el dropdown debe tener `role="listbox"` y cada resultado `role="option"`
- En la página `/tienda`, el filtro `q` se combina con `categoria` y `talle` en la query de Prisma con `AND`
- Nunca mostrar el dropdown si `q` tiene menos de 2 caracteres o está vacío

## Criterios de aceptación
- [ ] El buscador aparece a la izquierda del carrito en desktop
- [ ] El input se expande/colapsa con animación suave
- [ ] El dropdown aparece con resultados reales a los 300ms de dejar de escribir
- [ ] Cada resultado del dropdown navega correctamente al producto
- [ ] El link "Ver todos" navega a `/tienda?q=query`
- [ ] Enter navega a `/tienda?q=query`
- [ ] La página `/tienda` filtra por `q` correctamente
- [ ] Los filtros de categoría y talle siguen funcionando junto con `q`
- [ ] El botón "Limpiar búsqueda" elimina el filtro `q`
- [ ] En mobile la barra se despliega bajo el navbar (no rompe el layout)
- [ ] Sin resultados muestra el estado vacío correcto
- [ ] TypeScript sin errores

## Archivos a crear/modificar

**CREAR:**
- `src/components/public/SearchDropdown.tsx` — panel de resultados (Client Component)
- `src/app/api/search/route.ts` — GET endpoint de búsqueda

**MODIFICAR:**
- `src/components/public/Navbar.tsx` — agregar estado y UI del buscador
- `src/app/(public)/tienda/page.tsx` — agregar filtro por `q` en la query Prisma y en el header

## Diseño visual

### Navbar desktop — buscador cerrado
```
[VALMONT]         [TIENDA]         [🔍] [🛒]
```

### Navbar desktop — buscador abierto
```
[VALMONT]    [TIENDA]   [BUSCAR PRODUCTOS... ✕] [🛒]
                         └────────────────────┘
                              240px, animado
```

### Dropdown
```
┌─────────────────────────────────┐
│  [img] Remera Oversize     $XX  │
│  [img] Remera Negra        $XX  │
│  [img] Remera Blanca       $XX  │
│─────────────────────────────────│
│  Ver todos los resultados →     │
└─────────────────────────────────┘
```

### Navbar mobile — buscador abierto
```
┌─────────────────────────────────┐  ← navbar original
│  [VALMONT]           [🔍][🛒][☰]│
├─────────────────────────────────┤  ← barra que aparece debajo
│  [ BUSCAR PRODUCTOS...       ✕ ]│
└─────────────────────────────────┘
```

### Tienda con búsqueda activa
```
5 RESULTADOS PARA "REMERA"    [✕ Limpiar]
TIENDA
[filtros de categoría y talle igual que siempre]
[grid de productos filtrados]
```

## Lógica de búsqueda en Prisma

```ts
// src/app/api/search/route.ts
const where: Prisma.ProductWhereInput = {
  is_published: true,
  OR: [
    { name:        { contains: q, mode: 'insensitive' } },
    { description: { contains: q, mode: 'insensitive' } },
    { tags:        { has: q } },
  ],
}
```

```ts
// src/app/(public)/tienda/page.tsx — con q
if (query) {
  where.OR = [
    { name:        { contains: query, mode: 'insensitive' } },
    { description: { contains: query, mode: 'insensitive' } },
  ]
}
```

## Notas adicionales para el agente
- El debounce manual: `const timer = useRef<ReturnType<typeof setTimeout>>(); clearTimeout(timer.current); timer.current = setTimeout(() => fetchResults(q), 300)`
- Para cerrar el dropdown al hacer clic fuera: `useEffect` con `document.addEventListener('mousedown', handler)` + cleanup, verificar que el clic no fue dentro del ref del componente
- La animación de expansión del input: usar `transition-[width]` de Tailwind con `w-0 overflow-hidden` → `w-60`, controlado por clase condicional
- El `SearchDropdown` debe estar posicionado con `absolute` relativo al contenedor del input (que debe tener `relative`)
- En mobile, la barra de búsqueda adicional: agregar un `<div>` extra en el Navbar con `md:hidden` que se muestra condicionalmente con `useState`
- El thumbnail en el dropdown: usar `<img>` normal con `width={40} height={40}` y `object-cover`, no `next/image` para no complicar el domain config
