---
titulo: Rediseño página de inicio con animaciones
proyecto: VALMONT E-commerce
estado: completado
fecha: 2026-05-21
agente: claude
prioridad: alta
estimacion: 2 días
---

## Objetivo
Rediseñar la página de inicio (`/`) para que sea visualmente impactante y premium usando GSAP con ScrollTrigger, manteniendo la paleta verde/crema y el estilo urbano-elegante de VALMONT, con una experiencia de scroll tipo Zara/COS.

## Contexto
La página de inicio actual es funcional pero estática: un hero con fondo verde oscuro, el texto "VALMONT" y un grid de 4 productos. No tiene animaciones, ni secciones de marca, ni scroll storytelling. Este rediseño agrega capas visuales y movimiento para que la primera impresión sea memorable.

## Comportamiento esperado

**Al cargar la página:**
- El navbar entra con un fade desde arriba (100ms de delay)
- El label "NUEVA COLECCIÓN" se desliza desde la izquierda (opacity 0→1, x: -30→0, duration: 0.8s)
- "VALMONT" se revela letra por letra de izquierda a derecha (stagger 0.05s por letra, y: 60→0, opacity 0→1)
- El subtítulo aparece fade up (y: 20→0, opacity 0→1, delay: 0.6s)
- El botón CTA sube desde abajo (y: 30→0, opacity 0→1, delay: 0.9s)
- Un scroll indicator (línea animada pulsante) aparece abajo del hero

**Sección Marquee (nueva, entre hero y productos):**
- Texto horizontal que se desplaza infinitamente de derecha a izquierda: "VALMONT · NUEVA COLECCIÓN · URBANO ELEGANTE · MADE IN ARGENTINA · "
- Fondo blanco `#fafafa`, texto en verde `#1b3022`, tipografía Bebas Neue grande
- Velocidad constante, sin pausa

**Sección "Últimos productos" (al hacer scroll):**
- El título "ÚLTIMOS PRODUCTOS" se revela con clip-path: `inset(0 100% 0 0)` → `inset(0 0% 0 0)` al entrar al viewport
- Los 4 product cards entran con stagger: cada uno sube (y: 50→0, opacity 0→1) con 0.15s de diferencia
- El link "VER TODO →" aparece con fade después de los cards

**Sección "Nuestra esencia" (nueva, después de productos):**
- Layout: mitad izquierda imagen de marca (fondo verde oscuro con texto), mitad derecha texto editorial
- Contenido izquierdo: gran número o frase tipográfica (ej: "EST. 2024") en Bebas enorme
- Contenido derecho: párrafo corto sobre la marca + CTA "CONOCER MÁS" → (puede ir a `/tienda` por ahora)
- Animación: cuando entra al viewport, los dos lados se deslizan hacia el centro desde los bordes (left side: x: -60→0, right side: x: 60→0, opacity 0→1)

**Footer (existe, aplicar animación):**
- Fade up al entrar al viewport (opacity 0→1, y: 20→0)

## Inputs
No aplica (página Server Component que pasa productos a componentes cliente)

## Outputs
No aplica (página de visualización)

## Stack técnico para este feature
- Lenguaje: TypeScript
- Framework: Next.js 16 (App Router) — la página raíz sigue siendo Server Component
- Animaciones: **GSAP 3** + plugin **ScrollTrigger** (`npm install gsap`)
- Hook de GSAP: `useGSAP` de `@gsap/react` (`npm install @gsap/react`)
- UI: Tailwind CSS 4, Bebas Neue, Inter
- Componentes animados: todos deben ser `"use client"` y recibir datos como props

## Restricciones y reglas
- La página `src/app/(public)/page.tsx` es Server Component — NO convertirla en Client Component
- Toda lógica de animación va en componentes cliente separados que reciben datos como props
- Crear `src/lib/gsap/index.ts` para registrar plugins una sola vez: `gsap.registerPlugin(ScrollTrigger)`
- `useGSAP` de `@gsap/react` maneja el cleanup automáticamente — usarlo en lugar de `useEffect` manual
- Las animaciones de entrada de hero deben ejecutarse solo en cliente (no en SSR) — usar `useGSAP` con `scope`
- El marquee debe ser accesible: `aria-hidden="true"` ya que es decorativo
- `prefers-reduced-motion`: si el usuario tiene esta preferencia activa, no ejecutar animaciones (`window.matchMedia('(prefers-reduced-motion: reduce)')`)
- No instalar otras librerías de animación (Framer Motion, Anime.js, etc.)

## Criterios de aceptación
- [ ] El hero anima correctamente al cargar (sin flash de contenido)
- [ ] El marquee se desplaza de forma continua y fluida
- [ ] Los productos se revelan con stagger al hacer scroll
- [ ] La sección "Nuestra esencia" anima al entrar al viewport
- [ ] `prefers-reduced-motion` desactiva todas las animaciones
- [ ] No hay layout shift visible durante las animaciones
- [ ] Performance: no baja de 90 en Lighthouse mobile
- [ ] Funciona en mobile (animaciones adaptadas, sin lag)
- [ ] TypeScript sin errores

## Archivos a crear/modificar

**INSTALAR:**
- `npm install gsap @gsap/react`

**CREAR:**
- `src/lib/gsap/index.ts` — registra plugins de GSAP
- `src/components/public/HeroSection.tsx` — hero animado (Client Component)
- `src/components/public/MarqueeSection.tsx` — ticker de texto infinito (Client Component)
- `src/components/public/EssenceSection.tsx` — sección "Nuestra esencia" (Client Component)
- `src/components/public/AnimatedProductGrid.tsx` — wrapper del grid con animación scroll (Client Component)

**MODIFICAR:**
- `src/app/(public)/page.tsx` — reemplazar JSX actual con los nuevos componentes, mantener fetch de datos

## Diseño visual por sección

### Hero
```
┌─────────────────────────────────────────┐
│  [fondo: #0f1f14 con pattern geométrico] │
│                                          │
│         NUEVA COLECCIÓN  ←── label-tag   │
│                                          │
│   V A L M O N T         ←── Bebas 160px │
│                                          │
│   Indumentaria urbano-elegante...        │
│                                          │
│         [ VER COLECCIÓN ]               │
│                                          │
│              ↓ (scroll indicator)        │
└─────────────────────────────────────────┘
```

### Marquee
```
┌─────────────────────────────────────────┐
│  VALMONT · NUEVA COLECCIÓN · MADE IN AR ›│
└─────────────────────────────────────────┘
```

### Esencia
```
┌──────────────┬──────────────────────────┐
│  [verde]     │  "Definimos nuestro      │
│              │   propio estilo"         │
│  EST. 2024   │                          │
│              │  Texto editorial...      │
│              │                          │
│              │  [ CONOCER MÁS ]        │
└──────────────┴──────────────────────────┘
```

## Notas adicionales para el agente
- GSAP ScrollTrigger en Next.js necesita que el `trigger` sea un ref del DOM, no un selector string global
- El marquee se implementa con CSS animation (`@keyframes marquee`) en lugar de GSAP para mejor performance en loop infinito
- Los textos del hero que se animan letra por letra: usar `SplitText` de GSAP si está disponible en la versión instalada, sino dividir el string manualmente con `.split("")` y hacer `map` con spans
- Referencia de easing premium: `power2.out` para entradas, `power1.inOut` para transiciones de sección
- Duration estándar: 0.8s para elementos individuales, 1.2s para secciones completas
