import { openai } from "./client";
import { formatARS } from "@/lib/utils";

interface CaptionInput {
  name:        string;
  category:    string;
  description: string;
  tags:        string[];
  price_sale:  number;
}

export async function generateInstagramCaption(product: CaptionInput): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "Sos el community manager de VALMONT, marca de indumentaria urbano-elegante argentina. " +
          "Escribís captions de Instagram que combinan estética editorial con copy de ventas efectivo. " +
          "Tono: seguro, aspiracional y directo. Español rioplatense sin emojis excesivos. " +
          "Formato obligatorio (respetá exactamente el orden):\n" +
          "1. Hook de 1-2 líneas (máx. 80 chars)\n" +
          "2. Línea vacía\n" +
          "3. Descripción de 1-2 oraciones\n" +
          "4. Línea vacía\n" +
          "5. Precio y CTA (usa exactamente: 💰 [precio] | 🔗 Link en bio)\n" +
          "NO incluyas hashtags — se agregan por separado.\n" +
          "Respondé SOLO con el texto, sin comillas.",
      },
      {
        role: "user",
        content:
          `Producto: "${product.name}"\n` +
          `Categoría: ${product.category}\n` +
          `Descripción: ${product.description}\n` +
          `Precio: ${formatARS(product.price_sale)}\n` +
          `Tags: ${product.tags.join(", ")}`,
      },
    ],
    max_tokens: 250,
    temperature: 0.8,
  });

  const body = (completion.choices[0].message.content ?? "").trim();

  const hashtags = [
    "#valmont",
    "#valmont_arg",
    `#${product.category}`,
    ...product.tags.map((t) => `#${t.replace(/\s+/g, "").toLowerCase()}`),
    "#modaargentina",
    "#streetstyle",
    "#ootd",
    "#indumentaria",
  ]
    .filter((v, i, a) => a.indexOf(v) === i) // dedupe
    .join(" ");

  return `${body}\n\n${hashtags}`;
}
