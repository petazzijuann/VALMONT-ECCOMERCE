import type { Context } from "telegraf";
import { prisma } from "@/lib/prisma/client";
import { uploadToCloudinary } from "@/lib/cloudinary/upload";
import { getSession, setSession, clearSession } from "../state";
import type { ColorVariant } from "@/types";

function parseStock(text: string): Record<string, number> | null {
  const stock: Record<string, number> = {};
  const pairs = text.toUpperCase().match(/([A-Z]+)\s*[:\s]\s*(\d+)/g);
  if (!pairs || pairs.length === 0) return null;
  for (const pair of pairs) {
    const parts = pair.split(/[:\s]+/).filter(Boolean);
    if (parts.length === 2) {
      const qty = parseInt(parts[1]);
      if (!isNaN(qty) && qty >= 0) stock[parts[0]] = qty;
    }
  }
  return Object.keys(stock).length > 0 ? stock : null;
}

function stockSummary(stock: Record<string, number>): string {
  return Object.entries(stock).map(([s, q]) => `${s}: ${q}`).join(" | ");
}

export async function handleAddColor(ctx: Context) {
  const chatId = ctx.from!.id.toString();
  await clearSession(chatId);
  await setSession(chatId, { state: "addcolor_waiting_search", addColorData: {} });
  await ctx.reply("🔍 ¿A qué producto querés agregar un color? Escribí el nombre o parte del nombre.");
}

export async function handleAddColorText(ctx: Context) {
  const chatId  = ctx.from!.id.toString();
  const session = await getSession(chatId);
  const text    = (ctx.message as { text?: string })?.text?.trim() ?? "";

  switch (session.state) {
    case "addcolor_waiting_search": {
      const products = await prisma.product.findMany({
        where: { name: { contains: text, mode: "insensitive" } },
        select: { id: true, name: true },
        take: 5,
      });
      if (products.length === 0) {
        await ctx.reply("❌ No encontré productos con ese nombre. Intentá de nuevo.");
        return;
      }
      await setSession(chatId, { ...session, state: "addcolor_waiting_product_choice" });
      await ctx.reply(
        "Elegí el producto:",
        {
          reply_markup: {
            inline_keyboard: products.map((p) => [
              { text: p.name, callback_data: `addcolor_product:${p.id}` },
            ]),
          },
        }
      );
      break;
    }

    case "addcolor_waiting_name": {
      await setSession(chatId, {
        ...session,
        state: "addcolor_waiting_photos",
        addColorData: { ...session.addColorData, color_name: text, photos: [] },
      });
      await ctx.reply(
        `🎨 Color: *${text}*\n\nEnviá las fotos. Cuando termines escribí *LISTO*.`,
        { parse_mode: "Markdown" }
      );
      break;
    }

    case "addcolor_waiting_photos": {
      if (text.toUpperCase() !== "LISTO") return;
      const photos = session.addColorData?.photos ?? [];
      if (photos.length === 0) {
        await ctx.reply("❌ Tenés que subir al menos una foto antes de escribir LISTO.");
        return;
      }
      await setSession(chatId, { ...session, state: "addcolor_waiting_stock" });
      await ctx.reply(
        `✅ ${photos.length} foto(s) guardadas.\n\n📦 Stock para *${session.addColorData?.color_name}*:\n\`S:2 M:3 L:5 XL:2\``,
        { parse_mode: "Markdown" }
      );
      break;
    }

    case "addcolor_waiting_stock": {
      const stock = parseStock(text);
      if (!stock) {
        await ctx.reply("❌ Formato incorrecto. Usá:\n`S:2 M:3 L:5 XL:2`", { parse_mode: "Markdown" });
        return;
      }
      await setSession(chatId, {
        ...session,
        state: "addcolor_confirming",
        addColorData: { ...session.addColorData, stock },
      });
      const d = { ...session.addColorData, stock };
      await ctx.reply(
        `*Vista previa:*\n\nAgregar color *${d.color_name}* a *${d.product_name}*\nStock: ${stockSummary(stock)}\n${d.photos?.length ?? 0} foto(s)`,
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [[
              { text: "✅ Confirmar", callback_data: "addcolor:confirm" },
              { text: "❌ Cancelar",  callback_data: "addcolor:cancel" },
            ]],
          },
        }
      );
      break;
    }

    default:
      break;
  }
}

export async function handleAddColorPhoto(ctx: Context) {
  const chatId  = ctx.from!.id.toString();
  const session = await getSession(chatId);
  if (session.state !== "addcolor_waiting_photos") return;

  const msg    = ctx.message as { photo?: Array<{ file_id: string }> };
  if (!msg?.photo?.length) return;

  const fileId  = msg.photo[msg.photo.length - 1].file_id;
  const waiting = await ctx.reply("⏳ Subiendo foto...");
  try {
    const fileLink      = await ctx.telegram.getFileLink(fileId);
    const cloudinaryUrl = await uploadToCloudinary(fileLink.toString());
    const current       = session.addColorData?.photos ?? [];
    const updated       = [...current, cloudinaryUrl];
    await setSession(chatId, {
      ...session,
      addColorData: { ...session.addColorData, photos: updated },
    });
    await ctx.telegram.deleteMessage(ctx.chat!.id, waiting.message_id);
    await ctx.reply(`📷 Foto ${updated.length} recibida. Seguí enviando o escribí *LISTO*.`, { parse_mode: "Markdown" });
  } catch {
    await ctx.telegram.deleteMessage(ctx.chat!.id, waiting.message_id);
    await ctx.reply("❌ Error subiendo la foto. Intentá de nuevo.");
  }
}

export async function handleAddColorCallback(ctx: Context) {
  const chatId  = ctx.from!.id.toString();
  const session = await getSession(chatId);
  const data    = (ctx as { callbackQuery?: { data?: string } }).callbackQuery?.data ?? "";

  await ctx.answerCbQuery();

  if (data.startsWith("addcolor_product:")) {
    if (session.state !== "addcolor_waiting_product_choice") return;
    const productId = data.replace("addcolor_product:", "");
    const product   = await prisma.product.findUnique({ where: { id: productId }, select: { id: true, name: true } });
    if (!product) { await ctx.reply("❌ Producto no encontrado."); return; }

    await setSession(chatId, {
      ...session,
      state: "addcolor_waiting_name",
      addColorData: { product_id: productId, product_name: product.name },
    });
    await ctx.reply(`Producto: *${product.name}*\n\n¿Cómo se llama el nuevo color?`, { parse_mode: "Markdown" });
    return;
  }

  if (data === "addcolor:confirm") {
    if (session.state !== "addcolor_confirming") return;
    const d = session.addColorData!;

    const product = await prisma.product.findUnique({ where: { id: d.product_id! } });
    if (!product) { await ctx.reply("❌ Producto no encontrado."); return; }

    const existing = (product.color_variants ?? []) as unknown as ColorVariant[];
    const newVariant: ColorVariant = {
      name:   d.color_name!,
      images: d.photos!,
      stock:  d.stock!,
    };
    const updated = [...existing, newVariant];

    await prisma.product.update({
      where: { id: d.product_id! },
      data:  { color_variants: updated as object[] },
    });

    await clearSession(chatId);
    await ctx.reply(`✅ Color *${d.color_name}* agregado a *${d.product_name}* correctamente.`, { parse_mode: "Markdown" });
    return;
  }

  if (data === "addcolor:cancel") {
    await clearSession(chatId);
    await ctx.reply("❌ Cancelado.");
    return;
  }
}
