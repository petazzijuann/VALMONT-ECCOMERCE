import type { Context } from "telegraf";
import { prisma } from "@/lib/prisma/client";
import { uploadToCloudinary } from "@/lib/cloudinary/upload";
import { getSession, setSession, clearSession } from "../state";
import type { ColorVariant } from "@/types";

export async function handleAddFotos(ctx: Context) {
  const chatId = ctx.from!.id.toString();
  await clearSession(chatId);
  await setSession(chatId, { state: "addfotos_waiting_search", addFotosData: {} });
  await ctx.reply("🔍 ¿A qué producto querés agregarle fotos? Escribí el nombre o parte del nombre.");
}

export async function handleAddFotosText(ctx: Context) {
  const chatId  = ctx.from!.id.toString();
  const session = await getSession(chatId);
  const text    = (ctx.message as { text?: string })?.text?.trim() ?? "";

  switch (session.state) {
    case "addfotos_waiting_search": {
      const products = await prisma.product.findMany({
        where:  { name: { contains: text, mode: "insensitive" } },
        select: { id: true, name: true },
        take:   5,
      });
      if (products.length === 0) {
        await ctx.reply("❌ No encontré productos con ese nombre. Intentá de nuevo.");
        return;
      }
      await setSession(chatId, { ...session, state: "addfotos_waiting_product_choice" });
      await ctx.reply("Elegí el producto:", {
        reply_markup: {
          inline_keyboard: products.map((p) => [
            { text: p.name, callback_data: `addfotos_prod:${p.id}` },
          ]),
        },
      });
      break;
    }

    case "addfotos_waiting_photos": {
      if (text.toUpperCase() !== "LISTO") return;
      const photos = session.addFotosData?.new_photos ?? [];
      if (photos.length === 0) {
        await ctx.reply("❌ Tenés que subir al menos una foto antes de escribir LISTO.");
        return;
      }
      const d = session.addFotosData!;
      await setSession(chatId, { ...session, state: "addfotos_confirming" });
      await ctx.reply(
        `*Vista previa:*\n\n` +
        `Agregar *${photos.length} foto(s)* al color *${d.color_name}* de *${d.product_name}*\n` +
        `_(ya tenía ${d.existing_count} foto(s))_`,
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [[
              { text: "✅ Confirmar", callback_data: "addfotos:confirm" },
              { text: "❌ Cancelar",  callback_data: "addfotos:cancel" },
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

export async function handleAddFotosPhoto(ctx: Context) {
  const chatId  = ctx.from!.id.toString();
  const session = await getSession(chatId);
  if (session.state !== "addfotos_waiting_photos") return;

  const msg    = ctx.message as { photo?: Array<{ file_id: string }> };
  if (!msg?.photo?.length) return;

  const fileId  = msg.photo[msg.photo.length - 1].file_id;
  const waiting = await ctx.reply("⏳ Subiendo foto...");
  try {
    const fileLink      = await ctx.telegram.getFileLink(fileId);
    const cloudinaryUrl = await uploadToCloudinary(fileLink.toString());
    const current       = session.addFotosData?.new_photos ?? [];
    const updated       = [...current, cloudinaryUrl];
    await setSession(chatId, {
      ...session,
      addFotosData: { ...session.addFotosData, new_photos: updated },
    });
    await ctx.telegram.deleteMessage(ctx.chat!.id, waiting.message_id);
    await ctx.reply(`📷 Foto ${updated.length} recibida. Seguí enviando o escribí *LISTO*.`, { parse_mode: "Markdown" });
  } catch {
    await ctx.telegram.deleteMessage(ctx.chat!.id, waiting.message_id);
    await ctx.reply("❌ Error subiendo la foto. Intentá de nuevo.");
  }
}

export async function handleAddFotosCallback(ctx: Context) {
  const chatId  = ctx.from!.id.toString();
  const session = await getSession(chatId);
  const data    = (ctx as { callbackQuery?: { data?: string } }).callbackQuery?.data ?? "";

  await ctx.answerCbQuery().catch(() => null);

  // Selección de producto
  if (data.startsWith("addfotos_prod:")) {
    if (session.state !== "addfotos_waiting_product_choice") return;
    const productId = data.replace("addfotos_prod:", "");
    const product   = await prisma.product.findUnique({
      where:  { id: productId },
      select: { id: true, name: true, color_variants: true, images: true },
    });
    if (!product) { await ctx.reply("❌ Producto no encontrado."); return; }

    const variants = (product.color_variants ?? []) as unknown as ColorVariant[];

    // Producto con un solo color → saltar selección de color
    if (variants.length <= 1) {
      const colorName      = variants[0]?.name ?? "Único";
      const existingCount  = variants[0]?.images.length ?? (product.images as string[]).length;
      await setSession(chatId, {
        ...session,
        state: "addfotos_waiting_photos",
        addFotosData: {
          product_id:     productId,
          product_name:   product.name,
          color_name:     colorName,
          new_photos:     [],
          existing_count: existingCount,
        },
      });
      await ctx.reply(
        `Producto: *${product.name}* — color *${colorName}* (${existingCount} foto(s) actuales)\n\nEnviá las nuevas fotos. Cuando termines escribí *LISTO*.`,
        { parse_mode: "Markdown" }
      );
      return;
    }

    // Producto multi-color → elegir color
    await setSession(chatId, {
      ...session,
      state: "addfotos_waiting_color_choice",
      addFotosData: { product_id: productId, product_name: product.name, new_photos: [] },
    });
    await ctx.reply(
      `Producto: *${product.name}*\n\n¿A qué color querés agregar fotos?`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: variants.map((v) => [
            {
              text:          `${v.name} (${v.images.length} foto(s))`,
              callback_data: `addfotos_color:${v.name}`,
            },
          ]),
        },
      }
    );
    return;
  }

  // Selección de color
  if (data.startsWith("addfotos_color:")) {
    if (session.state !== "addfotos_waiting_color_choice") return;
    const colorName = data.replace("addfotos_color:", "");
    const product   = await prisma.product.findUnique({
      where:  { id: session.addFotosData!.product_id! },
      select: { color_variants: true },
    });
    const variants      = (product?.color_variants ?? []) as unknown as ColorVariant[];
    const variant       = variants.find((v) => v.name === colorName);
    const existingCount = variant?.images.length ?? 0;

    await setSession(chatId, {
      ...session,
      state: "addfotos_waiting_photos",
      addFotosData: {
        ...session.addFotosData,
        color_name:     colorName,
        new_photos:     [],
        existing_count: existingCount,
      },
    });
    await ctx.reply(
      `Color: *${colorName}* (${existingCount} foto(s) actuales)\n\nEnviá las nuevas fotos. Cuando termines escribí *LISTO*.`,
      { parse_mode: "Markdown" }
    );
    return;
  }

  // Confirmar
  if (data === "addfotos:confirm") {
    if (session.state !== "addfotos_confirming") return;
    const d = session.addFotosData!;

    const product = await prisma.product.findUnique({
      where:  { id: d.product_id! },
      select: { color_variants: true, images: true },
    });
    if (!product) { await ctx.reply("❌ Producto no encontrado."); return; }

    const variants = (product.color_variants ?? []) as unknown as ColorVariant[];
    const updated  = variants.map((v) =>
      v.name === d.color_name
        ? { ...v, images: [...v.images, ...(d.new_photos ?? [])] }
        : v
    );

    // Si no había variantes, creamos una con las fotos nuevas
    if (updated.length === 0) {
      updated.push({ name: d.color_name!, images: d.new_photos ?? [], stock: {} });
    }

    await prisma.product.update({
      where: { id: d.product_id! },
      data:  {
        color_variants: updated as object[],
        // Sincronizar el campo images principal con el primer color
        images: updated[0].images,
      },
    });

    await clearSession(chatId);
    await ctx.reply(
      `✅ ${d.new_photos?.length} foto(s) agregada(s) al color *${d.color_name}* de *${d.product_name}*.`,
      { parse_mode: "Markdown" }
    );
    return;
  }

  // Cancelar
  if (data === "addfotos:cancel") {
    await clearSession(chatId);
    await ctx.reply("❌ Cancelado.");
    return;
  }
}
