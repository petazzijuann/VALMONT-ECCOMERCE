---
titulo: Secciones de publicidades en página de inicio (carrusel + Urbano + OldMoney)
proyecto: VALMONT E-commerce
estado: completado
fecha: 2026-05-21
agente: claude
prioridad: alta
estimacion: 1 día
---

## Objetivo
Agregar tres secciones visuales a la página de inicio usando imágenes de campaña locales: un carrusel automático con zoom en la imagen activa, y dos secciones editoriales (Urbano y OldMoney) con dos imágenes cada una que hacen zoom al acercar el mouse.

## Contexto
Las imágenes de campaña están en la carpeta `PUBLICIDADES/` del repositorio, divididas en tres subcarpetas:
- `PUBLICIDADES/CARRUSEL/` — múltiples imágenes para el carrusel automático
- `PUBLICIDADES/URBANO/` — exactamente 2 imágenes para la sección Urbano
- `PUBLICIDADES/OLDMONEY/` — exactamente 2 imágenes para la sección OldMoney

Actualmente esas carpetas están vacías — el usuario las llenará con las imágenes. El agente debe dejar el código listo para cuando las imágenes estén disponibles.

Feature relacionado: `02-redesign-pagina-inicio.md` (mismo archivo de página, misma librería GSAP)

## Orden de secciones en la página de inicio
```
1. Hero (verde, VALMONT, CTA)       ← ya existe
2. Carrusel de publicidades         ← NUEVO (este spec)
3. Marquee de texto                 ← spec 02
4. Últimos productos                ← ya existe
5. Sección Urbano                   ← NUEVO (este spec)
6. Sección OldMoney                 ← NUEVO (este spec)
7. Sección "Nuestra esencia"        ← spec 02
```

## Preparación de imágenes — PASO OBLIGATORIO ANTES DE IMPLEMENTAR

Las imágenes deben copiarse desde `PUBLICIDADES/` hacia `public/publicidades/` para que Next.js pueda servirlas:

```
PUBLICIDADES/CARRUSEL/  →  public/publicidades/carrusel/
PUBLICIDADES/URBANO/    →  public/publicidades/urbano/
PUBLICIDADES/OLDMONEY/  →  public/publicidades/oldmoney/
```

El agente debe crear las carpetas en `public/` y definir en el componente un array con los nombres de archivo esperados. Si al momento de implementar las imágenes ya están disponibles, usar los nombres reales. Si no, dejar placeholders con un comentario `// TODO: reemplazar con nombres reales`.

## Comportamiento esperado

---

### SECCIÓN 1: Carrusel automático

**Layout:**
- Ancho full (`w-full`), altura `min-h-[70vh]` en desktop, `min-h-[55vw]` en mobile
- Sin márgenes laterales — llega de borde a borde
- Cada slide ocupa el 100% del contenedor

**Animación de slides:**
- Transición entre slides: cross-fade (opacity 1→0 en el saliente, opacity 0→1 en el entrante)
- Duration: 0.8s, ease: ease-in-out
- Auto-avance: cada 4 segundos
- El timer se reinicia si el usuario hace clic en un punto de navegación

**Zoom en la imagen activa:**
- La imagen del slide ACTIVO tiene `transform: scale(1.04)` con `transition: transform 6s ease-out`
- Al cambiar de slide, la nueva imagen activa empieza en scale(1) y va animando hacia scale(1.04) durante los 4 segundos que está activa — efecto Ken Burns suave
- La imagen saliente vuelve a scale(1) antes de hacer fade out
- Implementar con CSS classes dinámicas, no GSAP (es más performante en loop)

**Navegación:**
- Puntos (dots) centrados horizontalmente en la parte inferior del carrusel
- Cada punto: círculo pequeño (`w-2 h-2`), fondo blanco semitransparente cuando inactivo, blanco sólido cuando activo
- Al hacer clic en un punto → saltar a ese slide (reiniciar timer)
- Sin flechas de navegación (el diseño es limpio)

**Texto overlay opcional:**
- Si se desea mostrar texto sobre el carrusel, posicionarlo con `absolute` en la esquina inferior izquierda
- Fondo semitransparente oscuro detrás del texto
- Por defecto: sin texto overlay (dejar comentado en el código como opción)

**Comportamiento:**
- Pausar el auto-avance cuando la pestaña está en segundo plano (`document.visibilitychange`)
- El carrusel es decorativo: no navega a ninguna URL al hacer clic (las imágenes son publicidades)

---

### SECCIÓN 2: Urbano (dos imágenes con hover zoom)

**Layout desktop:**
```
┌────────────────────┬────────────────────┐
│                    │                    │
│    imagen 1        │    imagen 2        │
│    (izquierda)     │    (derecha)       │
│                    │                    │
└────────────────────┴────────────────────┘
```
- Dos columnas iguales (`grid-cols-2`), sin gap entre ellas
- Altura: `aspect-[3/4]` (formato retrato, como una foto de ropa)
- En mobile: apiladas (`grid-cols-1`), cada una con `aspect-[4/3]`

**Header de sección (encima de las imágenes):**
- Label tag: "COLECCIÓN" (en `label-tag` con `text-muted-foreground`)
- Título: "URBANO" (en Bebas Neue, `text-5xl`)
- Alineado a la izquierda, con padding horizontal estándar (`px-4 sm:px-6 lg:px-8`)
- `mb-6` de separación entre el header y las imágenes

**Efecto hover zoom:**
- El contenedor de cada imagen tiene `overflow-hidden` y `cursor-pointer`
- La imagen interior (`next/image` con `object-cover`) tiene:
  - `transition: transform 0.6s ease`
  - En estado normal: `transform: scale(1)`
  - En `:hover` del contenedor: `transform: scale(1.08)`
- Implementar con clases de Tailwind o CSS inline — sin GSAP (hover puro CSS es más performante)
- El contenedor puede tener un overlay oscuro muy sutil que aparece en hover: `bg-black/10` con `opacity-0 hover:opacity-100 transition-opacity`

---

### SECCIÓN 3: OldMoney (dos imágenes con hover zoom)

Mismo comportamiento y layout que la sección Urbano, con estas diferencias:
- Label tag: "COLECCIÓN"
- Título: "OLD MONEY"
- Las imágenes vienen de `public/publicidades/oldmoney/`
- Separación de la sección Urbano: `mt-24` o `py-16`

---

## Inputs
No aplica (componentes de visualización estática, sin datos de base de datos)

## Outputs
No aplica

## Stack técnico para este feature
- Lenguaje: TypeScript
- Framework: Next.js 16 (App Router)
- Imágenes: `next/image` con `fill` y `object-cover` dentro de un contenedor con `position: relative`
- Animaciones: CSS puro (`transition`, `transform`, `opacity`) — sin GSAP para este feature
- UI: Tailwind CSS 4
- Estado del carrusel: `useState` (índice actual) + `useEffect` (timer) — Client Component

## Restricciones y reglas
- La página `src/app/(public)/page.tsx` es Server Component — los 3 nuevos componentes son Client Components que se importan ahí
- Usar `next/image` en todos los casos (no `<img>` nativa) para optimización automática
- En `next.config.ts`, las imágenes de `public/` no necesitan configuración extra — ya funciona
- El carrusel debe tener `aria-label="Carrusel de campañas VALMONT"` para accesibilidad
- Cada imagen del carrusel debe tener `alt` descriptivo (ej: `"Campaña VALMONT ${index + 1}"`)
- Las imágenes de Urbano y OldMoney deben tener `alt` específicos (ej: `"Colección Urbano VALMONT - imagen 1"`)
- `prefers-reduced-motion`: si está activo, desactivar el auto-avance del carrusel y el efecto Ken Burns; las secciones fijas siguen funcionando
- El array de imágenes del carrusel debe estar definido en el propio componente (no en un archivo de config separado) para facilitar el mantenimiento
- Si una imagen no existe, `next/image` dará error en build — el agente debe asegurarse de que los paths sean correctos o usar un placeholder

## Criterios de aceptación
- [ ] El carrusel avanza automáticamente cada 4 segundos
- [ ] El efecto Ken Burns (zoom suave) se ve en la imagen activa
- [ ] La transición entre slides es un cross-fade suave, sin flash
- [ ] Los dots de navegación funcionan y muestran el slide correcto como activo
- [ ] El timer se pausa cuando la pestaña está en segundo plano
- [ ] Las imágenes de Urbano y OldMoney están lado a lado en desktop
- [ ] El hover zoom en Urbano y OldMoney funciona suavemente sin overflow visible
- [ ] En mobile: carrusel a full height proporcional, Urbano/OldMoney apiladas
- [ ] `prefers-reduced-motion` desactiva el auto-avance y el Ken Burns
- [ ] No hay layout shift al cargar las imágenes (usar `fill` + contenedor con tamaño definido)
- [ ] TypeScript sin errores

## Archivos a crear/modificar

**CREAR (carpetas de imágenes):**
- `public/publicidades/carrusel/` — copiar imágenes desde `PUBLICIDADES/CARRUSEL/`
- `public/publicidades/urbano/` — copiar imágenes desde `PUBLICIDADES/URBANO/`
- `public/publicidades/oldmoney/` — copiar imágenes desde `PUBLICIDADES/OLDMONEY/`

**CREAR (componentes):**
- `src/components/public/PublicidadCarrusel.tsx` — carrusel automático (Client Component)
- `src/components/public/SeccionEditorial.tsx` — componente genérico para Urbano y OldMoney (acepta título, label y array de 2 imágenes como props)

**MODIFICAR:**
- `src/app/(public)/page.tsx` — importar y agregar los 3 nuevos componentes en el orden correcto

## Estructura del componente carrusel

```tsx
// PublicidadCarrusel.tsx
const SLIDES = [
  { src: "/publicidades/carrusel/imagen-1.jpg", alt: "Campaña VALMONT 1" },
  { src: "/publicidades/carrusel/imagen-2.jpg", alt: "Campaña VALMONT 2" },
  // agregar más según las imágenes disponibles
]
```

## Estructura del componente editorial

```tsx
// SeccionEditorial.tsx — se usa dos veces, una para Urbano y otra para OldMoney
interface Props {
  label: string       // "COLECCIÓN"
  title: string       // "URBANO" o "OLD MONEY"
  images: [           // exactamente 2
    { src: string; alt: string },
    { src: string; alt: string },
  ]
}

// Uso en page.tsx:
<SeccionEditorial
  label="COLECCIÓN"
  title="URBANO"
  images={[
    { src: "/publicidades/urbano/imagen-1.jpg", alt: "Colección Urbano VALMONT - imagen 1" },
    { src: "/publicidades/urbano/imagen-2.jpg", alt: "Colección Urbano VALMONT - imagen 2" },
  ]}
/>

<SeccionEditorial
  label="COLECCIÓN"
  title="OLD MONEY"
  images={[
    { src: "/publicidades/oldmoney/imagen-1.jpg", alt: "Colección Old Money VALMONT - imagen 1" },
    { src: "/publicidades/oldmoney/imagen-2.jpg", alt: "Colección Old Money VALMONT - imagen 2" },
  ]}
/>
```

## Diseño visual detallado

### Carrusel
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│           [imagen de campaña, full width]           │
│           [zoom suave Ken Burns activo]             │
│                                                     │
│                    ○ ● ○ ○                          │  ← dots
└─────────────────────────────────────────────────────┘
  min-h: 70vh desktop / 55vw mobile
  sin márgenes laterales
```

### Sección Urbano / OldMoney
```
  COLECCIÓN                          ← label-tag, gris
  URBANO                             ← Bebas, 5xl, negro

┌──────────────────┬──────────────────┐
│                  │                  │
│  [imagen 1]      │  [imagen 2]      │
│  aspect-[3/4]    │  aspect-[3/4]    │
│                  │                  │
│  hover → zoom    │  hover → zoom    │
│  scale(1.08)     │  scale(1.08)     │
│                  │                  │
└──────────────────┴──────────────────┘
  sin gap entre columnas
```

## Lógica del carrusel (pseudocódigo)

```tsx
const [current, setCurrent] = useState(0)
const [isKenBurns, setIsKenBurns] = useState(true)

// Auto-avance
useEffect(() => {
  if (prefersReducedMotion) return
  const interval = setInterval(() => {
    setCurrent(prev => (prev + 1) % SLIDES.length)
    setIsKenBurns(false)
    // pequeño delay para reiniciar el Ken Burns en la nueva imagen
    setTimeout(() => setIsKenBurns(true), 50)
  }, 4000)
  return () => clearInterval(interval)
}, [])

// Pausa cuando tab está en background
useEffect(() => {
  const handler = () => { /* pausar/reanudar */ }
  document.addEventListener('visibilitychange', handler)
  return () => document.removeEventListener('visibilitychange', handler)
}, [])
```

## CSS para hover zoom (Tailwind + grupo)

```tsx
// En SeccionEditorial.tsx
<div className="relative overflow-hidden aspect-[3/4] group cursor-pointer">
  <Image
    src={img.src}
    alt={img.alt}
    fill
    className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.08]"
  />
  {/* overlay sutil */}
  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-700" />
</div>
```

## Notas adicionales para el agente
- El efecto Ken Burns: aplicar `transition-transform duration-[6000ms]` y alternar entre `scale-100` y `scale-[1.04]` con un className condicional basado en si el slide es el activo
- Para el cross-fade entre slides: posicionar todos los slides con `position: absolute` dentro del contenedor, y alternar `opacity-0`/`opacity-100` según el índice activo
- Los dots: `SLIDES.map((_, i) => <button onClick={() => goTo(i)} className={i === current ? "bg-white" : "bg-white/40"} />)`
- `prefers-reduced-motion` check: `window.matchMedia('(prefers-reduced-motion: reduce)').matches` dentro del `useEffect`
- Si las imágenes aún no están copiadas a `public/`, el agente puede usar imágenes placeholder de Cloudinary o una URL pública para que el componente al menos renderice sin errores
- Las imágenes de campaña suelen ser verticales (retrato) para moda — el `aspect-[3/4]` en las secciones editoriales es el formato ideal
- Para el carrusel, si las imágenes son horizontales (landscape), cambiar a `aspect-[16/9]` o `min-h-[70vh]` con `fill` sin aspect-ratio fijo
