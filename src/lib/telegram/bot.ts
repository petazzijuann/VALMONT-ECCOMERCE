import { Telegraf } from "telegraf";
import { getSession } from "./state";
import {
  handleNuevo,
  handlePhoto,
  handleText as handleUploadText,
  handleCallback as handleUploadCallback,
} from "./handlers/upload-product";
import { handleVenta, handleSaleText, handleSaleCallback } from "./handlers/sale";
import { handleMetricas, handleStock } from "./handlers/metrics";

const globalForBot = globalThis as unknown as { telegramBot: Telegraf };

export const bot =
  globalForBot.telegramBot ?? new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

if (process.env.NODE_ENV !== "production") globalForBot.telegramBot = bot;

// Auth guard — rejects any sender that isn't the owner
bot.use(async (ctx, next) => {
  if (ctx.from?.id.toString() !== process.env.TELEGRAM_ADMIN_CHAT_ID) {
    await ctx.reply("No autorizado");
    return;
  }
  return next();
});

// ── Commands ─────────────────────────────────────────────────
bot.command("nuevo",     handleNuevo);
bot.command("venta",     handleVenta);
bot.command("metricas",  handleMetricas);
bot.command("stock",     handleStock);
bot.command("ayuda", async (ctx) => {
  await ctx.reply(
    "*Comandos disponibles:*\n\n" +
    "/nuevo — Cargar nuevo producto\n" +
    "/venta — Registrar venta offline\n" +
    "/metricas — Ver ventas y márgenes\n" +
    "/stock — Ver stock actual\n" +
    "/ayuda — Este mensaje",
    { parse_mode: "Markdown" }
  );
});

// ── Photos (only relevant during product upload) ──────────────
bot.on("photo", handlePhoto);

// ── Text: dispatch by session state prefix ────────────────────
bot.on("text", async (ctx) => {
  const chatId = ctx.from!.id.toString();
  const session = await getSession(chatId);

  if (session.state.startsWith("upload_")) return handleUploadText(ctx);
  if (session.state.startsWith("sale_"))   return handleSaleText(ctx);
});

// ── Callbacks: dispatch by data prefix ───────────────────────
bot.on("callback_query", async (ctx) => {
  const data = (ctx.callbackQuery as { data?: string })?.data ?? "";

  if (data.startsWith("cat:") || data.startsWith("upload:")) {
    return handleUploadCallback(ctx);
  }
  if (
    data.startsWith("product:") ||
    data.startsWith("size:") ||
    data.startsWith("pay:") ||
    data.startsWith("sale:")
  ) {
    return handleSaleCallback(ctx);
  }

  await ctx.answerCbQuery();
});
