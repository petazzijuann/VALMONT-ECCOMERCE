---
titulo: Nueva página de contacto con animaciones
proyecto: VALMONT E-commerce
estado: completado
fecha: 2026-05-21
agente: claude
prioridad: media
estimacion: 1 día
---

## Objetivo
Crear la página `/contacto` con un formulario de contacto animado, información de canales de comunicación de VALMONT y un diseño editorial premium que refleje la identidad de la marca.

## Contexto
VALMONT no tiene actualmente ninguna página de contacto. Los clientes que quieren comunicarse con la marca no tienen un canal directo dentro del sitio. Esta página llena ese vacío y también suma una URL importante para SEO.

Features relacionados: `02-redesign-pagina-inicio.md` (GSAP ya instalado y configurado)

## Comportamiento esperado

**Al cargar la página:**
- La sección hero de la página entra con el mismo patrón del inicio: label + título en Bebas con reveal de clip-path
- Los dos bloques del layout (formulario + info de contacto) entran desde los lados al hacer scroll:
  - Formulario: entra desde la izquierda (x: -60→0, opacity 0→1)
  - Info de contacto: entra desde la derecha (x: 60→0, opacity 0→1)

**Formulario:**
- Campos: Nombre, Email, Asunto (opcional), Mensaje
- Validación client-side con Zod antes de enviar
- Al hacer focus en un campo: el label sube y se achica (animación tipo "floating label")
- Botón "ENVIAR MENSAJE": mismo estilo animado que el botón del carrito (fill de izquierda a derecha en hover)
- Estados del botón:
  - Idle: `ENVIAR MENSAJE`
  - Loading: `ENVIANDO...` (mientras espera la API)
  - Éxito: `✓ MENSAJE ENVIADO` — mensaje verde debajo del formulario: "Recibimos tu consulta. Te respondemos en menos de 24hs."
  - Error: mensaje rojo debajo: "Hubo un error al enviar. Intentá de nuevo."
- Después del éxito: el formulario se resetea después de 3 segundos

**Sección de información de contacto:**
- Email: `hola@valmont.com.ar` (o el real) con ícono de Lucide `Mail`
- Instagram: `@valmont` con ícono de Lucide `Instagram`  
- WhatsApp: número con ícono de Lucide `MessageCircle`
- Horario de atención: "Lunes a Viernes, 10 a 18hs"
- Cada ítem entra con stagger (0.1s de diferencia) al entrar al viewport
- Hover en cada ítem: underline animado de izquierda a derecha

**Sección de cierre (al final de la página):**
- Franja de fondo verde oscuro `#0f1f14`
- Texto grande en Bebas: "HABLEMOS" centrado
- Subtexto: "Respondemos todas las consultas"
- Esta sección paralaxea ligeramente al scrollear (fondo se mueve más lento que el contenido)

**Navbar:**
- Agregar link "CONTACTO" al navbar desktop y al menú mobile

## Inputs — Formulario
- nombre: string, mínimo 2 caracteres
- email: string, formato email válido
- asunto: string, opcional, máximo 100 caracteres
- mensaje: string, mínimo 10 caracteres, máximo 1000 caracteres

## Outputs — API
- En caso de éxito: `{ ok: true }` (HTTP 200)
- En caso de error de validación: `{ error: string, field?: string }` (HTTP 400)
- En caso de error del servidor: `{ error: "Error interno" }` (HTTP 500)

## Qué hace la API con el mensaje
- Guarda el mensaje en una tabla nueva `ContactMessage` en la base de datos
- Envía una notificación al bot de Telegram (usando `src/lib/telegram/bot.ts`) con los datos del formulario

## Stack técnico para este feature
- Lenguaje: TypeScript
- Framework: Next.js 16 (App Router)
- Animaciones: GSAP 3 + ScrollTrigger (ya instalado)
- UI: shadcn/ui (`Input`, `Textarea`, `Button`, `Label`) + Tailwind CSS 4
- Validación: Zod (cliente y servidor)
- Base de datos: Prisma + Supabase
- Notificación: Telegram bot (`src/lib/telegram/bot.ts`)

## Restricciones y reglas
- La página `/contacto` es Client Component (necesita estado del formulario) — usar `"use client"` en el componente de formulario, no en el page
- `src/app/(public)/contacto/page.tsx` puede ser Server Component con el formulario como componente hijo cliente
- La API route valida con Zod en el servidor, independientemente de la validación cliente
- Rate limiting básico: rechazar si el mismo IP envía más de 3 mensajes en 1 hora (usar headers de request o tabla de BD)
- El link "CONTACTO" en el navbar: verificar que no rompa el layout mobile existente
- Los datos de contacto reales (email, Instagram, WhatsApp) deben venir de variables de entorno o estar en un archivo de configuración, no hardcodeados en el componente

## Criterios de aceptación
- [ ] La página existe y es accesible en `/contacto`
- [ ] El formulario valida correctamente todos los campos
- [ ] Los 3 estados del botón funcionan (idle, loading, éxito/error)
- [ ] El mensaje se guarda en la base de datos
- [ ] La notificación de Telegram se envía correctamente
- [ ] Las animaciones de entrada funcionan en scroll
- [ ] Los floating labels del formulario funcionan en focus
- [ ] El link de CONTACTO aparece en el navbar
- [ ] Funciona en mobile
- [ ] TypeScript sin errores

## Archivos a crear/modificar

**CREAR:**
- `src/app/(public)/contacto/page.tsx` — página (Server Component shell)
- `src/components/public/ContactForm.tsx` — formulario animado (Client Component)
- `src/components/public/ContactInfo.tsx` — sección de datos de contacto (Client Component)
- `src/app/api/contact/route.ts` — POST endpoint para recibir el formulario

**MODIFICAR:**
- `prisma/schema.prisma` — agregar modelo `ContactMessage`
- `src/components/public/Navbar.tsx` — agregar link "CONTACTO"
- `.env.example` — agregar variables de configuración de contacto

## Modelo de base de datos

```prisma
model ContactMessage {
  id        String   @id @default(cuid())
  nombre    String
  email     String
  asunto    String?
  mensaje   String
  createdAt DateTime @default(now())
}
```

## Diseño visual

### Layout general
```
┌─────────────────────────────────────────┐
│  [navbar VALMONT + TIENDA + CONTACTO]   │
├─────────────────────────────────────────┤
│  CONTACTO               ←── Bebas 5xl  │
│  Estamos para ayudarte  ←── label-tag  │
├───────────────────┬─────────────────────┤
│  ENVIANOS         │  ENCONTRANOS        │
│  UN MENSAJE       │                     │
│                   │  ✉ hola@valmont...  │
│  [Nombre    ]     │  📷 @valmont        │
│  [Email     ]     │  💬 +54 11 ...      │
│  [Asunto    ]     │                     │
│  [Mensaje   ]     │  Lun a Vie          │
│                   │  10 a 18hs          │
│  [ENVIAR ▶▶]     │                     │
└───────────────────┴─────────────────────┘
│         HABLEMOS          ←── Bebas     │
│   Respondemos todas las consultas       │
└─────────────────────────────────────────┘
```

## Variables de entorno a agregar
```env
NEXT_PUBLIC_CONTACT_EMAIL=hola@valmont.com.ar
NEXT_PUBLIC_CONTACT_INSTAGRAM=@valmont
NEXT_PUBLIC_CONTACT_WHATSAPP=+5491100000000
```

## Notas adicionales para el agente
- Los floating labels: implementar con `peer` de Tailwind — el `<label>` es `peer-focus:` o `peer-not-placeholder-shown:` para subir cuando hay contenido
- La notificación a Telegram: formatear el mensaje así: `📩 Nuevo mensaje de contacto\nNombre: ${nombre}\nEmail: ${email}\nMensaje: ${mensaje}`
- El efecto parallax en la sección final "HABLEMOS": usar ScrollTrigger con `scrub: true` y `y: "-20%"` en el texto interior
- Rate limiting simple: guardar un contador en la tabla `ContactMessage` por email, contar los últimos 60 minutos con `where: { email, createdAt: { gte: new Date(Date.now() - 3600000) } }` antes de insertar
- Correr migración después de agregar el modelo: `npx prisma migrate dev --name add-contact-message`
