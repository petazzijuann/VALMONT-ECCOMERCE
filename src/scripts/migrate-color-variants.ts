/**
 * Migración one-time: convierte todos los productos sin color_variants
 * a tener un único color "Único" usando sus imágenes y stock actuales.
 *
 * Correr UNA SOLA VEZ:
 *   npx ts-node --project tsconfig.json src/scripts/migrate-color-variants.ts
 */

import { PrismaClient } from "../generated/prisma/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new (PrismaClient as any)();

async function main() {
  const products = await prisma.product.findMany();
  let migrated = 0;

  for (const p of products) {
    const variants = p.color_variants as unknown[];
    if (Array.isArray(variants) && variants.length > 0) {
      console.log(`⏭  Omitiendo ${p.name} (ya tiene variantes)`);
      continue;
    }

    await prisma.product.update({
      where: { id: p.id },
      data: {
        color_variants: [
          {
            name:   "Único",
            images: p.images,
            stock:  p.stock,
          },
        ],
      },
    });

    console.log(`✅ ${p.name} → color "Único" creado`);
    migrated++;
  }

  console.log(`\nListo. ${migrated} productos migrados.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
