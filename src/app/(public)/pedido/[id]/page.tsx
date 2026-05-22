import { notFound } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Clock } from "lucide-react";
import { prisma } from "@/lib/prisma/client";
import { formatARS } from "@/lib/utils";
import type { OrderItem, CustomerAddress } from "@/types";

export default async function PedidoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) notFound();

  const items = order.items as unknown as OrderItem[];
  const address = order.customer_address as unknown as CustomerAddress;
  const isTransfer = order.payment_method === "transfer";
  const isPaid = order.status === "payment_confirmed";

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Estado */}
      <div className="text-center mb-12">
        {isPaid ? (
          <CheckCircle size={48} className="text-valmont-success mx-auto mb-4" strokeWidth={1.5} />
        ) : (
          <Clock size={48} className="text-cream-dark mx-auto mb-4" strokeWidth={1.5} />
        )}
        <h1 className="font-bebas text-4xl mb-2">
          {isPaid ? "PAGO CONFIRMADO" : "PEDIDO RECIBIDO"}
        </h1>
        <p className="text-muted-foreground text-sm">
          Pedido #{order.id.slice(0, 8).toUpperCase()}
        </p>
      </div>

      {/* Instrucciones de transferencia */}
      {isTransfer && !isPaid && (
        <div className="bg-brand-green text-brand-cream p-6 mb-8">
          <p className="font-bebas text-xl mb-4 tracking-widest">DATOS PARA TRANSFERIR</p>
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-cream-dark">CBU</span>
              <span className="font-mono">{process.env.CBU ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-cream-dark">Alias</span>
              <span className="font-mono">{process.env.ALIAS_CBU ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-cream-dark">Titular</span>
              <span>{process.env.TITULAR_CUENTA ?? "—"}</span>
            </div>
            <div className="flex justify-between border-t border-green-mid pt-2 mt-2">
              <span className="text-cream-dark label-tag">MONTO EXACTO</span>
              <span className="price-text text-lg">{formatARS(Number(order.total_amount))}</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-green-mid flex flex-col gap-1 text-sm">
            {process.env.CONTACT_PHONE && (
              <div className="flex justify-between">
                <span className="text-cream-dark">WhatsApp</span>
                <a
                  href={`https://wa.me/${process.env.CONTACT_PHONE.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-white transition-colors"
                >
                  {process.env.CONTACT_PHONE}
                </a>
              </div>
            )}
            {process.env.INSTAGRAM_HANDLE && (
              <div className="flex justify-between">
                <span className="text-cream-dark">Instagram</span>
                <a
                  href={`https://instagram.com/${process.env.INSTAGRAM_HANDLE}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-white transition-colors"
                >
                  @{process.env.INSTAGRAM_HANDLE}
                </a>
              </div>
            )}
          </div>
          <p className="label-tag text-cream-dark mt-3 text-[10px]">
            Enviá el comprobante con tu número de pedido #{order.id.slice(0, 8).toUpperCase()}.
          </p>
        </div>
      )}

      {/* Resumen del pedido */}
      <div className="border border-border p-6 mb-6">
        <p className="font-bebas text-xl mb-4">RESUMEN</p>
        <ul className="flex flex-col gap-2 mb-4">
          {items.map((item, i) => (
            <li key={i} className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {item.name} ({item.size}) ×{item.qty}
              </span>
              <span>{formatARS(item.price * item.qty)}</span>
            </li>
          ))}
        </ul>
        <div className="border-t border-border pt-3 flex justify-between">
          <p className="label-tag">TOTAL</p>
          <p className="price-text">{formatARS(Number(order.total_amount))}</p>
        </div>
      </div>

      {/* Datos del cliente */}
      <div className="border border-border p-6 mb-10 text-sm text-muted-foreground">
        <p className="label-tag text-foreground mb-3">DATOS DE ENVÍO</p>
        <p>{order.customer_name}</p>
        <p>{order.customer_email}</p>
        <p>{order.customer_phone}</p>
        <p className="mt-1">{address.street}, {address.city}</p>
        <p>{address.province} ({address.zip})</p>
      </div>

      <div className="text-center">
        <Link
          href="/tienda"
          className="inline-block bg-brand-green text-brand-cream px-10 py-4 font-bold tracking-widest text-sm hover:bg-green-mid transition-colors"
        >
          SEGUIR COMPRANDO
        </Link>
      </div>
    </div>
  );
}
