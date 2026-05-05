/**
 * Registra el webhook de Telegram apuntando a la URL de producción.
 *
 * Uso:
 *   pnpm webhook:register
 *
 * Las variables de entorno se leen de .env.local.
 * Asegurate de que NEXT_PUBLIC_BASE_URL sea la URL de producción antes de correr.
 */

const { TELEGRAM_BOT_TOKEN, NEXT_PUBLIC_BASE_URL, TELEGRAM_SECRET } = process.env;

if (!TELEGRAM_BOT_TOKEN || !NEXT_PUBLIC_BASE_URL || !TELEGRAM_SECRET) {
  console.error(
    "❌ Faltan variables de entorno.\n" +
    "   Requeridas: TELEGRAM_BOT_TOKEN, NEXT_PUBLIC_BASE_URL, TELEGRAM_SECRET"
  );
  process.exit(1);
}

const webhookUrl = `${NEXT_PUBLIC_BASE_URL}/api/telegram/webhook`;

console.log(`\n🔗 Registrando webhook en: ${webhookUrl}\n`);

const res = await fetch(
  `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url:             webhookUrl,
      secret_token:    TELEGRAM_SECRET,
      allowed_updates: ["message", "callback_query"],
    }),
  }
);

const data = await res.json();

if (data.ok) {
  console.log("✅ Webhook registrado correctamente.");
  console.log(`   URL: ${webhookUrl}`);
} else {
  console.error("❌ Error al registrar el webhook:", data.description);
  process.exit(1);
}
