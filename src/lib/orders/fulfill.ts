import { prisma } from "@/lib/prisma/client";
import { crearOrdenEnvio } from "@/lib/andreani/client";
import type { OrderItem, StockMap, CustomerAddress } from "@/types";

export async function reserveStock(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return;
  const items = order.items as unknown as OrderItem[];
  for (const item of items) {
    const product = await prisma.product.findUnique({
      where: { id: item.product_id },
      select: { stock: true },
    });
    if (!product) continue;
    const stock = product.stock as StockMap;
    stock[item.size] = Math.max(0, (stock[item.size] ?? 0) - item.qty);
    await prisma.product.update({ where: { id: item.product_id }, data: { stock } });
  }
}

export async function fulfillOrder(orderId: string, paymentMethod: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.status === "payment_confirmed") return;

  const items = order.items as unknown as OrderItem[];

  for (const item of items) {
    const product = await prisma.product.findUnique({
      where: { id: item.product_id },
      select: { price_cost: true },
    });
    if (!product) continue;
    await prisma.sale.create({
      data: {
        product_id:     item.product_id,
        product_name:   item.name,
        size:           item.size,
        quantity:       item.qty,
        sale_price:     item.price,
        cost_price:     product.price_cost,
        channel:        "online",
        payment_method: paymentMethod,
        order_id:       orderId,
      },
    });
  }

  await prisma.order.update({ where: { id: orderId }, data: { status: "payment_confirmed" } });

  // Crear orden en Andreani automáticamente al confirmar el pago
  const isAndreani =
    order.shipping_method === "andreani_standard" ||
    order.shipping_method === "andreani_express";

  if (isAndreani) {
    try {
      const address = order.customer_address as unknown as CustomerAddress;
      const result  = await crearOrdenEnvio({
        orderId:         order.id,
        customerName:    order.customer_name,
        customerAddress: address,
        shippingMethod:  order.shipping_method!,
        totalAmount:     Number(order.total_amount),
        items:           items.map((i) => ({ name: i.name, qty: i.qty })),
      });

      await prisma.order.update({
        where: { id: orderId },
        data: {
          andreani_tracking_id: result.trackingId,
          andreani_order_id:    result.andreaniOrderId,
        },
      });
    } catch (err) {
      // Si Andreani falla, el pedido igual queda confirmado
      console.error("Andreani crear orden error:", err);
    }
  }
}

export async function releaseStock(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return;
  const items = order.items as unknown as OrderItem[];
  for (const item of items) {
    const product = await prisma.product.findUnique({
      where: { id: item.product_id },
      select: { stock: true },
    });
    if (!product) continue;
    const stock = product.stock as StockMap;
    stock[item.size] = (stock[item.size] ?? 0) + item.qty;
    await prisma.product.update({ where: { id: item.product_id }, data: { stock } });
  }
  await prisma.order.update({ where: { id: orderId }, data: { status: "cancelled" } });
}
