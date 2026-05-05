import type { Context } from "telegraf";
import { prisma } from "@/lib/prisma/client";
import { getSession, setSession, clearSession } from "../state";
import { formatARS } from "@/lib/utils";

const PAYMENT_KEYBOARD = {
  inline_keyboard: [
    [
      { text: "💵 Efectivo",      callback_data: "pay:efectivo" },
      { text: "🔁 Transferencia", callback_data: "pay:transferencia" },
    ],
    [
      { text: "💳 Débito",  callback_data: "pay:debito" },
      { text: "💳 Crédito", callback_data: "pay:credito" },
    ],
  ],
};

export async function handleVenta(ctx: Context) {
  const chatId = ctx.from!.id.toString();
  await clearSession(chatId);
  await setSession(chatId, { state: "sale_waiting_search" });
  await ctx.reply(
    "🛍 *Nueva venta offline*\n\nEscribí el nombre del producto:",
    { parse_mode: "Markdown" }
  );
}

export async function handleSaleText(ctx: Context) {
  const chatId = ctx.from!.id.toString();
  const session = await getSession(chatId);
  const text = (ctx.message as { text?: string })?.text?.trim() ?? "";

  switch (session.state) {
    case "sale_waiting_search": {
      const products = await prisma.product.findMany({
        where: { name: { contains: text, mode: "insensitive" } },
        take: 6,
        select: { id: true, name: true },
      });

      if (products.length === 0) {
        await ctx.reply("❌ No encontré productos con ese nombre. Intentá de nuevo:");
        return;
      }

      const keyboard = products.map((p) => [
        { text: p.name, callback_data: `product:${p.id}` },
      ]);

      await ctx.reply("Seleccioná el producto:", {
        reply_markup: { inline_keyboard: keyboard },
      });
      break;
    }

    case "sale_waiting_quantity": {
      const qty = parseInt(text);
      if (isNaN(qty) || qty <= 0) {
        await ctx.reply("❌ Cantidad inválida. Enviá un número entero positivo:");
        return;
      }
      const suggested = session.saleData?.suggested_price ?? 0;
      await setSession(chatId, {
        ...session,
        state: "sale_waiting_price",
        saleData: { ...session.saleData, quantity: qty },
      });
      await ctx.reply(
        `📦 Cantidad: ${qty}\n\n` +
        `💰 ¿Precio de venta?\n` +
        `Precio actual: *${formatARS(suggested)}*\n\n` +
        `Enviá el monto o *ok* para usar el sugerido.`,
        { parse_mode: "Markdown" }
      );
      break;
    }

    case "sale_waiting_price": {
      let price: number;
      if (text.toLowerCase() === "ok") {
        price = session.saleData?.suggested_price ?? 0;
      } else {
        price = parseFloat(text.replace(/[^\d.]/g, ""));
      }
      if (isNaN(price) || price <= 0) {
        await ctx.reply(
          "❌ Precio inválido. Enviá un número o *ok* para usar el sugerido.",
          { parse_mode: "Markdown" }
        );
        return;
      }
      await setSession(chatId, {
        ...session,
        state: "sale_waiting_payment",
        saleData: { ...session.saleData, sale_price: price },
      });
      await ctx.reply("💳 ¿Cómo pagó?", { reply_markup: PAYMENT_KEYBOARD });
      break;
    }

    default:
      break;
  }
}

export async function handleSaleCallback(ctx: Context) {
  const chatId = ctx.from!.id.toString();
  const session = await getSession(chatId);
  const data = (ctx as { callbackQuery?: { data?: string } }).callbackQuery?.data ?? "";

  await ctx.answerCbQuery();

  if (data.startsWith("product:")) {
    const productId = data.replace("product:", "");
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true, price_sale: true, price_cost: true, stock: true },
    });
    if (!product) return;

    const stock = product.stock as Record<string, number>;
    const available = Object.entries(stock).filter(([, qty]) => qty > 0);

    if (available.length === 0) {
      await ctx.reply("❌ Este producto no tiene stock disponible.");
      await clearSession(chatId);
      return;
    }

    const sizeKeyboard = {
      inline_keyboard: [
        available.map(([size, qty]) => ({
          text: `${size} (${qty})`,
          callback_data: `size:${size}`,
        })),
      ],
    };

    await setSession(chatId, {
      ...session,
      state: "sale_waiting_size",
      saleData: {
        product_id:      product.id,
        product_name:    product.name,
        product_cost:    Number(product.price_cost),
        suggested_price: Number(product.price_sale),
      },
    });

    await ctx.reply(
      `Producto: *${product.name}*\n\n📐 ¿Qué talle?`,
      { parse_mode: "Markdown", reply_markup: sizeKeyboard }
    );
    return;
  }

  if (data.startsWith("size:")) {
    if (session.state !== "sale_waiting_size") return;
    const size = data.replace("size:", "");
    await setSession(chatId, {
      ...session,
      state: "sale_waiting_quantity",
      saleData: { ...session.saleData, size },
    });
    await ctx.reply(`Talle: *${size}*\n\n📦 ¿Cuántas unidades?`, {
      parse_mode: "Markdown",
    });
    return;
  }

  if (data.startsWith("pay:")) {
    if (session.state !== "sale_waiting_payment") return;
    const payment_method = data.replace("pay:", "");
    const d = { ...session.saleData, payment_method };
    const margin = d.sale_price && d.product_cost
      ? Math.round(((d.sale_price - d.product_cost) / d.sale_price) * 100)
      : 0;

    await setSession(chatId, { state: "sale_confirming", saleData: d });

    await ctx.reply(
      `*Vista previa de venta:*\n\n` +
      `📌 ${d.product_name}\n` +
      `📐 Talle: ${d.size} × ${d.quantity} u.\n` +
      `💰 Precio: ${formatARS(d.sale_price!)}\n` +
      `💵 Total: ${formatARS(d.sale_price! * d.quantity!)}\n` +
      `📊 Margen: ${margin}%\n` +
      `💳 Pago: ${payment_method}`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [[
            { text: "✅ Confirmar", callback_data: "sale:confirm" },
            { text: "❌ Cancelar",  callback_data: "sale:cancel" },
          ]],
        },
      }
    );
    return;
  }

  if (data === "sale:confirm") {
    if (session.state !== "sale_confirming") return;
    const d = session.saleData!;

    const product = await prisma.product.findUnique({
      where: { id: d.product_id! },
      select: { price_cost: true, stock: true },
    });
    if (!product) return;

    const stock = product.stock as Record<string, number>;
    const currentQty = stock[d.size!] ?? 0;

    if (currentQty < d.quantity!) {
      await ctx.reply(
        `❌ Stock insuficiente. Quedan ${currentQty} u. de talle ${d.size}.`
      );
      await clearSession(chatId);
      return;
    }

    await prisma.$transaction([
      prisma.sale.create({
        data: {
          product_id:     d.product_id!,
          product_name:   d.product_name!,
          size:           d.size!,
          quantity:       d.quantity!,
          sale_price:     d.sale_price!,
          cost_price:     Number(product.price_cost),
          channel:        "offline",
          payment_method: d.payment_method!,
        },
      }),
      prisma.product.update({
        where: { id: d.product_id! },
        data: { stock: { ...stock, [d.size!]: currentQty - d.quantity! } },
      }),
    ]);

    await clearSession(chatId);
    await ctx.reply(
      `✅ *Venta registrada*\n\n` +
      `${d.product_name} — ${d.size} × ${d.quantity}\n` +
      `Total: *${formatARS(d.sale_price! * d.quantity!)}*\n` +
      `Pago: ${d.payment_method}`,
      { parse_mode: "Markdown" }
    );
    return;
  }

  if (data === "sale:cancel") {
    await clearSession(chatId);
    await ctx.reply("❌ Venta cancelada.");
  }
}
