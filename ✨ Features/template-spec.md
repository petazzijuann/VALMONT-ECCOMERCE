---
titulo: [Nombre del feature]
proyecto: VALMONT E-commerce
estado: borrador | en-progreso | completado
fecha: {{date:YYYY-MM-DD}}
agente: claude
prioridad: alta | media | baja
estimacion: 2h | 1 día | 3 días
---

## Objetivo
UNA sola oración. Qué debe lograr este feature y para quién.
Mal: "Hacer el carrito"
Bien: "Permitir que los usuarios agreguen productos al carrito y vean el total actualizado en tiempo real sin recargar la página"

## Contexto
Por qué existe este feature. Qué problema del usuario resuelve.
Si hay features relacionados, mencionarlos y poner links a sus specs.
Si hay decisiones técnicas tomadas previamente, referenciarlas.

## Comportamiento esperado
Describir paso a paso qué pasa desde la perspectiva del usuario:
- El usuario hace clic en "Agregar al carrito" en la página de producto
- El drawer del carrito se abre automáticamente mostrando el producto agregado
- El contador del navbar se actualiza a la cantidad total de items
- Si el producto ya está en el carrito → incrementar cantidad, no duplicar
- Si no hay stock suficiente → mostrar error: "Stock insuficiente"

## Inputs
- productId: string (cuid de Prisma)
- quantity: number, mínimo 1, máximo = stock disponible
- variant: string opcional (ej: talle, color)

## Outputs
- En caso de éxito: estado del carrito actualizado en Zustand store
- En caso de error: toast con mensaje descriptivo

## Stack técnico para este feature
- Lenguaje: TypeScript
- Framework: Next.js 16 (App Router)
- UI: shadcn/ui + Tailwind CSS 4 + Lucide icons
- Estado cliente: Zustand (`src/store/cart.ts`)
- Base de datos: PostgreSQL vía Prisma (`src/lib/prisma/client.ts`)
- Auth: Supabase Auth (`src/lib/supabase/server.ts` para server, `client.ts` para browser)
- Storage: Cloudinary (`src/lib/cloudinary/upload.ts`)
- Validación: Zod
- NO agregar librerías externas sin consultar

## Restricciones y reglas
- Las API routes van en `src/app/api/`
- Las páginas públicas van en `src/app/(public)/`
- Las páginas de admin van en `src/app/(admin)/admin/`
- Los componentes de admin en `src/components/admin/`, los públicos en `src/components/public/`
- Lógica de negocio reutilizable va en `src/lib/`
- Nunca exponer claves de API en el cliente
- Siempre validar con Zod en las API routes antes de tocar la base de datos

## Criterios de aceptación (cómo saber si está bien)
- [ ] Funciona en desktop y mobile
- [ ] Los estados de carga (loading/skeleton) están implementados
- [ ] Los errores se muestran al usuario de forma clara
- [ ] No rompe features existentes (carrito, checkout, admin)
- [ ] TypeScript sin errores (`tsc --noEmit`)
- [ ] El flujo completo fue probado manualmente

## Archivos a crear/modificar
(Completar esto antes de dárselo al agente)
- CREAR: `src/app/api/[ruta]/route.ts`
- CREAR: `src/components/[zona]/[Componente].tsx`
- MODIFICAR: `src/store/cart.ts` (agregar acción X)
- MODIFICAR: `src/lib/orders/fulfill.ts` (agregar lógica Y)

## Notas adicionales para el agente
Cualquier contexto extra, decisiones ya tomadas, ejemplos de código
relevante de otras partes del proyecto, links a documentación externa.
