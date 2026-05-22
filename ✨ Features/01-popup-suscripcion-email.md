---
titulo: Popup de suscripción por email
proyecto: VALMONT E-commerce
estado: completado
fecha: 2026-05-20
agente: claude
prioridad: media
estimacion: 1 día
---

## Objetivo
Mostrar un popup en la página de inicio para capturar el email del visitante a cambio de beneficios o descuentos futuros, guardando la lista en la base de datos y haciéndola visible desde el panel de admin.

## Contexto
VALMONT no tiene actualmente ningún mecanismo para capturar leads o construir una lista de contactos. Este feature permite empezar a construir esa base sin depender de un servicio externo, con la lista accesible directamente desde el admin del sitio.

## Comportamiento esperado

**Flujo del visitante:**
- El usuario entra a la página de inicio (`/`)
- Después de 2 segundos aparece un modal con fondo oscurecido (overlay)
- El modal muestra: título, descripción del beneficio, campo de email y botón "Suscribirme"
- El usuario puede cerrar el popup con una X o haciendo clic fuera del modal
- Si el usuario cierra sin suscribirse → guardar flag en localStorage, no volver a mostrar
- Si el usuario ingresa su email y hace clic en "Suscribirme":
  - Mostrar spinner mientras procesa
  - Si el email ya está registrado → mostrar mensaje: "Este email ya está suscrito"
  - Si el email es nuevo → guardar en base de datos, mostrar mensaje de confirmación, cerrar popup luego de 2 segundos
- Si el usuario ya se suscribió o cerró el popup antes → nunca más aparece (localStorage persiste entre sesiones)

**Flujo del admin:**
- En el sidebar del admin aparece una nueva sección "Suscriptores"
- La página muestra una tabla con: email, fecha de suscripción
- Hay un botón "Exportar CSV" que descarga el listado completo

## Inputs
- email: string, formato email válido

## Outputs
- En caso de éxito: `{ ok: true }`
- En caso de email duplicado: `{ error: "Este email ya está suscrito" }` (HTTP 409)
- En caso de email inválido: `{ error: "Email inválido" }` (HTTP 400)

## Stack técnico para este feature
- Lenguaje: TypeScript
- Framework: Next.js 16 (App Router)
- UI: shadcn/ui (`Dialog`, `Input`, `Button`) + Tailwind CSS 4
- Base de datos: Prisma + Supabase PostgreSQL
- Validación: Zod
- Persistencia en browser: `localStorage` (key: `valmont_email_popup`)
- Estado local del componente: `useState` de React (sin Zustand, es estado efímero)

## Restricciones y reglas
- El popup SOLO aparece en `/` (layout público raíz, no en admin ni en otras rutas)
- El email debe ser único en la base de datos (constraint a nivel Prisma)
- El flag de localStorage debe guardar el estado: `"dismissed"` o `"subscribed"` — si existe cualquiera de los dos, no mostrar el popup
- El delay de 2 segundos se implementa con `setTimeout` dentro de un `useEffect`
- El componente debe ser un Client Component (`"use client"`)
- La exportación CSV se genera en el servidor (API route), no en el cliente
- El endpoint de admin (`/api/admin/subscribers`) debe verificar sesión de Supabase Auth antes de responder

## Criterios de aceptación
- [ ] El popup aparece 2 segundos después de entrar a `/`
- [ ] Si se cierra sin suscribir, no vuelve a aparecer al refrescar la página
- [ ] Si se suscribe, no vuelve a aparecer y se muestra mensaje de confirmación
- [ ] El email se guarda correctamente en la base de datos
- [ ] Emails duplicados muestran error sin romper la app
- [ ] La tabla de admin muestra todos los suscriptores con fecha
- [ ] El CSV se descarga correctamente con todos los emails
- [ ] El endpoint de admin rechaza requests sin sesión activa
- [ ] Funciona en mobile (modal ocupa el ancho completo de pantalla)
- [ ] TypeScript sin errores (`tsc --noEmit`)

## Archivos a crear/modificar

**CREAR:**
- `src/components/public/EmailSubscriptionPopup.tsx` — componente modal (Client Component)
- `src/app/api/subscriptions/route.ts` — POST para guardar el email
- `src/app/api/admin/subscribers/route.ts` — GET para listar y exportar CSV
- `src/app/(admin)/admin/suscriptores/page.tsx` — página del admin
- `src/components/admin/SubscribersTable.tsx` — tabla de suscriptores

**MODIFICAR:**
- `prisma/schema.prisma` — agregar modelo `Subscriber`
- `src/app/(public)/page.tsx` — importar y renderizar `<EmailSubscriptionPopup />`
- `src/components/admin/AdminSidebar.tsx` — agregar link a "Suscriptores"

## Modelo de base de datos

```prisma
model Subscriber {
  id        String   @id @default(cuid())
  email     String   @unique
  createdAt DateTime @default(now())
}
```

## Notas adicionales para el agente
- El componente `Dialog` de shadcn/ui ya está instalado en el proyecto, usarlo en lugar de construir el modal desde cero
- Para la exportación CSV, generar el contenido como string en la API route y responder con `Content-Type: text/csv` y `Content-Disposition: attachment; filename="suscriptores.csv"`
- El `AdminSidebar.tsx` usa un array de links, agregar ahí la entrada con el ícono `Mail` de Lucide
- Después de crear el modelo Prisma, correr `npx prisma migrate dev --name add-subscriber`
