import { openai } from "./client";

interface GeneratedContent {
  description: string;
  tags: string[];
}

export async function generateProductContent(
  name: string,
  category: string
): Promise<GeneratedContent> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "Sos copywriter de VALMONT, una marca de indumentaria urbano-elegante argentina. " +
          "Escribís descripciones de productos concisas, atractivas y en español rioplatense. " +
          "Respondé siempre en JSON con los campos: description (max 120 chars) y tags (array de 3-5 strings en minúscula).",
      },
      {
        role: "user",
        content: `Producto: "${name}", categoría: "${category}". Generá description y tags.`,
      },
    ],
    response_format: { type: "json_object" },
    max_tokens: 200,
  });

  const raw = completion.choices[0].message.content ?? "{}";
  const parsed = JSON.parse(raw) as Partial<GeneratedContent>;

  return {
    description: parsed.description ?? `${name} — indumentaria urbano-elegante VALMONT.`,
    tags:        parsed.tags ?? [category, "valmont", "urbano"],
  };
}
