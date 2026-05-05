import type { Context } from "telegraf";
import slugify from "slugify";
import { prisma } from "@/lib/prisma/client";
import { uploadToCloudinary } from "@/lib/cloudinary/upload";
import { generateProductContent } from "@/lib/openai/generate-description";
import { getSession, setSession, clearSession, type BotSessionData } from "../state";
import { formatARS } from "@/lib/utils";

const CATEGORIES = ["remeras", "pantalones", "buzos", "accesorios", "calzado"];

const CATEGORY_KEYBOARD = {
  inline_keyboard: [
    [
      { text: "👕 Remeras",    callback_data: "cat:remeras" },
      { text: "👖 Pantalones", callback_data: "cat:pantalones" },
    ],
    [
      { text: "🧥 Buzos",      callback_data: "cat:buzos" },
      { text: "👜 Accesorios", callback_data: "cat:accesorios" },
    ],
    [{ text: "👟 Calzado", callback_data: "cat:calzado" }],
  ],
};

function parseStock(text: string): Record<string, number> | null {
  // Acepta "S:2 M:3 L:5 XL:2" o "S 2 M 3 L 5"
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
  return Object.entries(stock)
    .map(([size, qty]) => `${size}: ${qty}`)
    .join(" | ");
}

// ── Comando /nuevo ───────────────────────────────────────────
export async function handleNuevo(ctx: Context) {
  const chatId = ctx.from!.id.toString();
  await clearSession(chatId);
  await setSession(chatId, { state: "upload_waiting_photo" });
  await ctx.reply(
    "📸 *Nuevo producto*\n\nEnviá la foto del producto (podés mandar varias, pero la primera se usa como principal).",
    { parse_mode: "Markdown" }
  );
}

// ── Foto recibida ────────────────────────────────────────────
export async function handlePhoto(ctx: Context) {
  const chatId = ctx.from!.id.toString();
  const session = await getSession(chatId);
  if (session.state !== "upload_waiting_photo") return;

  const msg = ctx.message as { photo?: Array<{ file_id: string }> };
  if (!msg?.photo?.length) return;

  const fileId = msg.photo[msg.photo.length - 1].file_id;
  const waiting = await ctx.reply("⏳ Subiendo imagen...");

  try {
    const fileLink = await ctx.telegram.getFileLink(fileId);
    const cloudinaryUrl = await uploadToCloudinary(fileLink.toString());

    await setSession(chatId, {
      state: "upload_waiting_name",
      uploadData: { photo_url: cloudinaryUrl },
    });

    await ctx.telegram.deleteMessage(ctx.chat!.id, waiting.message_id);
    await ctx.reply("✅ Foto subida.\n\n¿Cómo se llama el producto?");
  } catch {
    await ctx.telegram.deleteMessage(ctx.chat!.id, waiting.message_id);
    await ctx.reply("❌ Error subiendo la foto. Intentá de nuevo.");
  }
}

// ── Texto: ruteado por estado ────────────────────────────────
export async function handleText(ctx: Context) {
  const chatId = ctx.from!.id.toString();
  const session = await getSession(chatId);
  const text = (ctx.message as { text?: string })?.text?.trim() ?? "";

  switch (session.state) {
    case "upload_waiting_name": {
      await setSession(chatId, {
        ...session,
        state: "upload_waiting_category",
        uploadData: { ...session.uploadData, name: text },
      });
      await ctx.reply("¿Categoría?", { reply_markup: CATEGORY_KEYBOARD });
      break;
    }

    case "upload_waiting_stock": {
      const stock = parseStock(text);
      if (!stock) {
        await ctx.reply(
          "❌ Formato incorrecto. Usá:\n`S:2 M:3 L:5 XL:2`",
          { parse_mode: "Markdown" }
        );
        return;
      }
      await setSession(chatId, {
        ...session,
        state: "upload_waiting_price_sale",
        uploadData: { ...session.uploadData, stock },
      });
      await ctx.reply(
        `Stock guardado: ${stockSummary(stock)}\n\n💰 ¿Precio de venta? (ej: 25000)`
      );
      break;
    }

    case "upload_waiting_price_sale": {
      const price = parseFloat(text.replace(/[^\d.]/g, ""));
      if (isNaN(price) || price <= 0) {
        await ctx.reply("❌ Precio inválido. Enviá un número, ej: 25000");
        return;
      }
      await setSession(chatId, {
        ...session,
        state: "upload_waiting_price_cost",
        uploadData: { ...session.uploadData, price_sale: price },
      });
      await ctx.reply("🔒 ¿Precio de costo? (solo vos lo ves)");
      break;
    }

    case "upload_waiting_price_cost": {
      const cost = parseFloat(text.replace(/[^\d.]/g, ""));
      if (isNaN(cost) || cost <= 0) {
        await ctx.reply("❌ Precio inválido. Enviá un número, ej: 12000");
        return;
      }

      const waiting = await ctx.reply("🤖 Generando descripción con IA...");
      const { description, tags } = await generateProductContent(
        session.uploadData?.name ?? "",
        session.uploadData?.category ?? ""
      );
      await ctx.telegram.deleteMessage(ctx.chat!.id, waiting.message_id);

      const updatedData = {
        ...session.uploadData,
        price_cost: cost,
        description,
        tags,
      };
      await setSession(chatId, {
        state: "upload_confirming",
        uploadData: updatedData,
      });

      const margin = Math.round(
        ((updatedData.price_sale! - cost) / updatedData.price_sale!) * 100
      );

      await ctx.reply(
        `*Vista previa del producto:*\n\n` +
        `📌 *${updatedData.name}*\n` +
        `🏷 Categoría: ${updatedData.category}\n` +
        `📦 Stock: ${stockSummary(updatedData.stock ?? {})}\n` +
        `💰 Venta: ${formatARS(updatedData.price_sale!)}\n` +
        `🔒 Costo: ${formatARS(cost)} _(margen ${margin}%)_\n\n` +
        `📝 _${description}_\n` +
        `🔖 ${tags.join(", ")}`,
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [[
              { text: "✅ Confirmar",  callback_data: "upload:confirm" },
              { text: "❌ Cancelar", callback_data: "upload:cancel" },
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

// ── Callback: categoría y confirmación ───────────────────────
export async function handleCallback(ctx: Context) {
  const chatId = ctx.from!.id.toString();
  const session = await getSession(chatId);
  const data = (ctx as { callbackQuery?: { data?: string } }).callbackQuery?.data ?? "";

  await ctx.answerCbQuery();

  // Selección de categoría
  if (data.startsWith("cat:")) {
    if (session.state !== "upload_waiting_category") return;
    const category = data.replace("cat:", "");
    if (!CATEGORIES.includes(category)) return;

    await setSession(chatId, {
      ...session,
      state: "upload_waiting_stock",
      uploadData: { ...session.uploadData, category },
    });
    await ctx.reply(
      `Categoría: *${category}*\n\n📦 ¿Stock por talle?\nEjemplo: \`S:2 M:3 L:5 XL:2\``,
      { parse_mode: "Markdown" }
    );
    return;
  }

  // Confirmar producto
  if (data === "upload:confirm") {
    if (session.state !== "upload_confirming") return;
    const d = session.uploadData!;

    const baseSlug = slugify(d.name!, { lower: true, strict: true });
    let slug = baseSlug;
    let suffix = 2;
    while (await prisma.product.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${suffix}`;
      suffix++;
    }

    const product = await prisma.product.create({
      data: {
        name:         d.name!,
        slug,
        description:  d.description!,
        category:     d.category!,
        images:       [d.photo_url!],
        tags:         d.tags!,
        price_sale:   d.price_sale!,
        price_cost:   d.price_cost!,
        stock:        d.stock!,
        is_published: false,
      },
    });

    await clearSession(chatId);
    await ctx.reply(
      `✅ *Producto creado*\n\n` +
      `ID: \`${product.id.slice(0, 8)}\`\n` +
      `Slug: \`${product.slug}\`\n\n` +
      `El producto está guardado como *borrador*. Publicalo desde el panel admin.`,
      { parse_mode: "Markdown" }
    );
    return;
  }

  // Cancelar
  if (data === "upload:cancel") {
    await clearSession(chatId);
    await ctx.reply("❌ Carga cancelada.");
    return;
  }
}
