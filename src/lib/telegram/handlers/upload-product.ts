import type { Context } from "telegraf";
import slugify from "slugify";
import { prisma } from "@/lib/prisma/client";
import { uploadToCloudinary } from "@/lib/cloudinary/upload";
import { getSession, setSession, clearSession } from "../state";
import { formatARS } from "@/lib/utils";
import type { ColorVariant } from "@/types";

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

const COLOR_DECISION_KEYBOARD = {
  inline_keyboard: [[
    { text: "🎨 Único color",     callback_data: "color_decision:single" },
    { text: "🌈 Varios colores",  callback_data: "color_decision:multi" },
  ]],
};

const COLOR_MORE_KEYBOARD = {
  inline_keyboard: [[
    { text: "✅ Sí, agregar otro", callback_data: "color_more:yes" },
    { text: "🏁 No, listo",        callback_data: "color_more:no" },
  ]],
};

function parseStock(text: string): Record<string, number> | null {
  const stock: Record<string, number> = {};
  const pairs = text.toUpperCase().match(/([A-Z0-9]+)\s*[:\s]\s*(\d+)/g);
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

function stockExample(category?: string): string {
  return category === "pantalones"
    ? "36:2 38:3 40:5 42:2"
    : "S:2 M:3 L:5 XL:2 (o UNICO:10)";
}

function stockSummary(stock: Record<string, number>): string {
  return Object.entries(stock).map(([s, q]) => `${s}: ${q}`).join(" | ");
}

function colorEmoji(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("negro") || n.includes("black")) return "⚫";
  if (n.includes("blanco") || n.includes("white")) return "⚪";
  if (n.includes("rojo") || n.includes("red"))    return "🔴";
  if (n.includes("verde") || n.includes("green")) return "🟢";
  if (n.includes("azul") || n.includes("blue"))   return "🔵";
  if (n.includes("amarillo") || n.includes("yellow")) return "🟡";
  if (n.includes("naranja") || n.includes("orange"))  return "🟠";
  return "🎨";
}

function variantsSummary(variants: ColorVariant[]): string {
  return variants
    .map((v) => `  ${colorEmoji(v.name)} ${v.name} — ${stockSummary(v.stock)}`)
    .join("\n");
}

// ── Comando /nuevo ────────────────────────────────────────────
export async function handleNuevo(ctx: Context) {
  const chatId = ctx.from!.id.toString();
  await clearSession(chatId);
  await setSession(chatId, { state: "upload_waiting_photo" });
  await ctx.reply(
    "📸 *Nuevo producto*\n\nEnviá la foto del producto.",
    { parse_mode: "Markdown" }
  );
}

// ── Foto recibida ─────────────────────────────────────────────
export async function handlePhoto(ctx: Context) {
  const chatId  = ctx.from!.id.toString();
  const session = await getSession(chatId);
  const msg     = ctx.message as { photo?: Array<{ file_id: string }> };
  if (!msg?.photo?.length) return;

  const fileId = msg.photo[msg.photo.length - 1].file_id;

  // ── Primera foto del producto ──
  if (session.state === "upload_waiting_photo") {
    const waiting = await ctx.reply("⏳ Subiendo imagen...");
    try {
      const fileLink      = await ctx.telegram.getFileLink(fileId);
      const cloudinaryUrl = await uploadToCloudinary(fileLink.toString());
      await setSession(chatId, {
        state: "upload_waiting_photos",
        uploadData: { photo_urls: [cloudinaryUrl] },
      });
      await ctx.telegram.deleteMessage(ctx.chat!.id, waiting.message_id);
      await ctx.reply("📷 Foto 1 recibida. Enviá más o escribí *LISTO*.", { parse_mode: "Markdown" });
    } catch {
      await ctx.telegram.deleteMessage(ctx.chat!.id, waiting.message_id);
      await ctx.reply("❌ Error subiendo la foto. Intentá de nuevo.");
    }
    return;
  }

  // ── Fotos adicionales del producto (sigue acumulando) ──
  if (session.state === "upload_waiting_photos") {
    const waiting = await ctx.reply("⏳ Subiendo foto...");
    try {
      const fileLink      = await ctx.telegram.getFileLink(fileId);
      const cloudinaryUrl = await uploadToCloudinary(fileLink.toString());
      const current       = session.uploadData?.photo_urls ?? [];
      const updated       = [...current, cloudinaryUrl];
      await setSession(chatId, {
        ...session,
        uploadData: { ...session.uploadData, photo_urls: updated },
      });
      await ctx.telegram.deleteMessage(ctx.chat!.id, waiting.message_id);
      await ctx.reply(`📷 Foto ${updated.length} recibida. Enviá más o escribí *LISTO*.`, { parse_mode: "Markdown" });
    } catch {
      await ctx.telegram.deleteMessage(ctx.chat!.id, waiting.message_id);
      await ctx.reply("❌ Error subiendo la foto. Intentá de nuevo.");
    }
    return;
  }

  // ── Fotos por color (multi-color flow) ──
  if (session.state === "upload_waiting_color_photos") {
    const waiting = await ctx.reply("⏳ Subiendo foto...");
    try {
      const fileLink     = await ctx.telegram.getFileLink(fileId);
      const cloudinaryUrl = await uploadToCloudinary(fileLink.toString());
      const current       = session.uploadData?.current_photos ?? [];
      const updated       = [...current, cloudinaryUrl];
      await setSession(chatId, {
        ...session,
        uploadData: { ...session.uploadData, current_photos: updated },
      });
      await ctx.telegram.deleteMessage(ctx.chat!.id, waiting.message_id);
      await ctx.reply(`📷 Foto ${updated.length} recibida. Seguí enviando o escribí *LISTO*.`, { parse_mode: "Markdown" });
    } catch {
      await ctx.reply("❌ Error subiendo la foto. Intentá de nuevo.");
    }
  }
}

// ── Texto: ruteado por estado ─────────────────────────────────
export async function handleText(ctx: Context) {
  const chatId  = ctx.from!.id.toString();
  const session = await getSession(chatId);
  const text    = (ctx.message as { text?: string })?.text?.trim() ?? "";

  switch (session.state) {
    case "upload_waiting_photos": {
      if (text.toUpperCase() !== "LISTO") return;
      const photos = session.uploadData?.photo_urls ?? [];
      if (photos.length === 0) {
        await ctx.reply("❌ Tenés que subir al menos una foto antes de escribir LISTO.");
        return;
      }
      await setSession(chatId, { ...session, state: "upload_waiting_name" });
      await ctx.reply(`✅ ${photos.length} foto(s) guardadas.\n\n¿Cómo se llama el producto?`);
      break;
    }

    case "upload_waiting_name": {
      await setSession(chatId, {
        ...session,
        state: "upload_waiting_category",
        uploadData: { ...session.uploadData, name: text },
      });
      await ctx.reply("¿Categoría?", { reply_markup: CATEGORY_KEYBOARD });
      break;
    }

    case "upload_waiting_color_name": {
      const isFirstColor  = (session.uploadData?.color_variants ?? []).length === 0;
      const initialPhotos = session.uploadData?.photo_urls ?? [];
      await setSession(chatId, {
        ...session,
        state: "upload_waiting_color_photos",
        uploadData: {
          ...session.uploadData,
          current_color:  text,
          current_photos: isFirstColor && initialPhotos.length > 0 ? initialPhotos : [],
        },
      });
      const initial = isFirstColor && initialPhotos.length > 0
        ? `Ya tengo ${initialPhotos.length} foto(s) (las iniciales). Enviá más o escribí *LISTO*.`
        : `Enviá las fotos para *${text}*. Cuando termines escribí *LISTO*.`;
      await ctx.reply(initial, { parse_mode: "Markdown" });
      break;
    }

    case "upload_waiting_color_photos": {
      if (text.toUpperCase() !== "LISTO") return;
      const photos = session.uploadData?.current_photos ?? [];
      if (photos.length === 0) {
        await ctx.reply("❌ Tenés que subir al menos una foto antes de escribir LISTO.");
        return;
      }
      await setSession(chatId, { ...session, state: "upload_waiting_color_stock" });
      await ctx.reply(
        `✅ ${photos.length} foto(s) para *${session.uploadData?.current_color}* guardadas.\n\n📦 Stock para *${session.uploadData?.current_color}*:\n\`${stockExample(session.uploadData?.category)}\``,
        { parse_mode: "Markdown" }
      );
      break;
    }

    case "upload_waiting_color_stock": {
      const stock = parseStock(text);
      if (!stock) {
        await ctx.reply("❌ Formato incorrecto. Usá:\n`S:2 M:3 L:5 XL:2`", { parse_mode: "Markdown" });
        return;
      }
      const newVariant: ColorVariant = {
        name:   session.uploadData!.current_color!,
        images: session.uploadData!.current_photos!,
        stock,
      };
      const variants = [...(session.uploadData?.color_variants ?? []), newVariant];
      await setSession(chatId, {
        ...session,
        state: "upload_color_asking_more",
        uploadData: {
          ...session.uploadData,
          color_variants:  variants,
          current_color:   undefined,
          current_photos:  undefined,
        },
      });
      await ctx.reply(
        `Stock guardado: ${stockSummary(stock)}\n\n¿Agregar otro color?`,
        { reply_markup: COLOR_MORE_KEYBOARD }
      );
      break;
    }

    case "upload_waiting_stock": {
      const stock = parseStock(text);
      if (!stock) {
        await ctx.reply("❌ Formato incorrecto. Usá:\n`S:2 M:3 L:5 XL:2`", { parse_mode: "Markdown" });
        return;
      }
      await setSession(chatId, {
        ...session,
        state: "upload_waiting_price_sale",
        uploadData: { ...session.uploadData, stock },
      });
      await ctx.reply(`Stock guardado: ${stockSummary(stock)}\n\n💰 ¿Precio de venta? (ej: 25000)`);
      break;
    }

    case "upload_waiting_price_sale": {
      const price = parseFloat(text.replace(/[^\d.]/g, ""));
      if (isNaN(price) || price <= 0) { await ctx.reply("❌ Precio inválido."); return; }
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
      if (isNaN(cost) || cost <= 0) { await ctx.reply("❌ Precio inválido."); return; }
      await setSession(chatId, {
        ...session,
        state: "upload_waiting_description",
        uploadData: { ...session.uploadData, price_cost: cost },
      });
      await ctx.reply("📝 ¿Descripción del producto?");
      break;
    }

    case "upload_waiting_description": {
      if (text.length < 5) { await ctx.reply("❌ Descripción muy corta."); return; }
      await setSession(chatId, {
        ...session,
        state: "upload_waiting_weight",
        uploadData: { ...session.uploadData, description: text, tags: [] },
      });
      await ctx.reply("⚖️ ¿Peso del producto en kg? (ej: *0.5*)\nEscribí *OMITIR* si no sabés.", { parse_mode: "Markdown" });
      break;
    }

    case "upload_waiting_weight": {
      const upper = text.toUpperCase();
      const weightKg = upper === "OMITIR" ? null : parseFloat(text.replace(",", "."));
      if (upper !== "OMITIR" && (isNaN(weightKg!) || weightKg! < 0)) {
        await ctx.reply("❌ Peso inválido. Ingresá un número (ej: 0.5) o escribí *OMITIR*.", { parse_mode: "Markdown" });
        return;
      }

      const d = { ...session.uploadData, weight_kg: weightKg };
      await setSession(chatId, { state: "upload_confirming", uploadData: d });

      const hasColors = (d.color_variants?.length ?? 0) > 0;
      const margin    = Math.round(((d.price_sale! - d.price_cost!) / d.price_sale!) * 100);
      const weightLine = weightKg != null ? `⚖️ Peso: ${weightKg} kg\n` : "";

      const preview = hasColors
        ? `*Vista previa del producto:*\n\n` +
          `📌 *${d.name}*\n` +
          `🏷 Categoría: ${d.category}\n` +
          `🎨 Colores:\n${variantsSummary(d.color_variants!)}\n` +
          `💰 Venta: ${formatARS(d.price_sale!)}\n` +
          `🔒 Costo: ${formatARS(d.price_cost!)} _(margen ${margin}%)_\n` +
          weightLine +
          `\n📝 _${d.description}_`
        : `*Vista previa del producto:*\n\n` +
          `📌 *${d.name}*\n` +
          `🏷 Categoría: ${d.category}\n` +
          `📦 Stock: ${stockSummary(d.stock ?? {})}\n` +
          `💰 Venta: ${formatARS(d.price_sale!)}\n` +
          `🔒 Costo: ${formatARS(d.price_cost!)} _(margen ${margin}%)_\n` +
          weightLine +
          `\n📝 _${d.description}_`;

      await ctx.reply(preview, {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [[
            { text: "✅ Confirmar", callback_data: "upload:confirm" },
            { text: "❌ Cancelar",  callback_data: "upload:cancel" },
          ]],
        },
      });
      break;
    }

    default:
      break;
  }
}

// ── Callback: categoría, decisión de color y confirmación ─────
export async function handleCallback(ctx: Context) {
  const chatId  = ctx.from!.id.toString();
  const session = await getSession(chatId);
  const data    = (ctx as { callbackQuery?: { data?: string } }).callbackQuery?.data ?? "";

  await ctx.answerCbQuery().catch(() => null);

  // Selección de categoría
  if (data.startsWith("cat:")) {
    if (session.state !== "upload_waiting_category") return;
    const category = data.replace("cat:", "");
    if (!CATEGORIES.includes(category)) return;

    await setSession(chatId, {
      ...session,
      state: "upload_waiting_color_decision",
      uploadData: { ...session.uploadData, category },
    });
    await ctx.reply(
      `Categoría: *${category}*\n\n¿El producto tiene variantes de color?`,
      { parse_mode: "Markdown", reply_markup: COLOR_DECISION_KEYBOARD }
    );
    return;
  }

  // Decisión: un solo color
  if (data === "color_decision:single") {
    if (session.state !== "upload_waiting_color_decision") return;
    await setSession(chatId, { ...session, state: "upload_waiting_stock", uploadData: { ...session.uploadData, has_colors: false } });
    await ctx.reply(`📦 ¿Stock por talle?\n\`${stockExample(session.uploadData?.category)}\``, { parse_mode: "Markdown" });
    return;
  }

  // Decisión: varios colores
  if (data === "color_decision:multi") {
    if (session.state !== "upload_waiting_color_decision") return;
    await setSession(chatId, { ...session, state: "upload_waiting_color_name", uploadData: { ...session.uploadData, has_colors: true, color_variants: [] } });
    await ctx.reply("🎨 ¿Cómo se llama el primer color? (ej: negro, rojo, verde)");
    return;
  }

  // Agregar otro color
  if (data === "color_more:yes") {
    if (session.state !== "upload_color_asking_more") return;
    await setSession(chatId, { ...session, state: "upload_waiting_color_name" });
    await ctx.reply("🎨 ¿Cómo se llama el siguiente color?");
    return;
  }

  // No más colores → continuar con precios
  if (data === "color_more:no") {
    if (session.state !== "upload_color_asking_more") return;
    await setSession(chatId, { ...session, state: "upload_waiting_price_sale" });
    await ctx.reply("💰 ¿Precio de venta? (ej: 25000)");
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
      slug = `${baseSlug}-${suffix++}`;
    }

    const hasColors   = (d.color_variants?.length ?? 0) > 0;
    const firstVariant = hasColors ? d.color_variants![0] : null;

    // color_variants para guardar
    const baseImages: string[] = hasColors ? (firstVariant?.images ?? []) : (d.photo_urls ?? []);
    const colorVariantsData: ColorVariant[] = hasColors
      ? d.color_variants!
      : [{ name: "Único", images: d.photo_urls ?? [], stock: d.stock ?? {} }];

    const product = await prisma.product.create({
      data: {
        name:           d.name!,
        slug,
        description:    d.description!,
        category:       d.category!,
        images:         baseImages,
        tags:           d.tags ?? [],
        price_sale:     d.price_sale!,
        price_cost:     d.price_cost!,
        stock:          hasColors ? (firstVariant?.stock ?? {}) : (d.stock ?? {}),
        color_variants: colorVariantsData as object[],
        weight_kg:      d.weight_kg ?? null,
        is_published:   false,
      },
    });

    await clearSession(chatId);
    await ctx.reply(
      `✅ *Producto creado*\n\nID: \`${product.id.slice(0, 8)}\`\nSlug: \`${product.slug}\`\n\nGuardado como *borrador*. Publicalo desde el panel admin.`,
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
