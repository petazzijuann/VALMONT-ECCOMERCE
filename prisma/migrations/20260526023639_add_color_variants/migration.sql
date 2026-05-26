-- AlterTable
ALTER TABLE "products" ADD COLUMN     "color_variants" JSONB NOT NULL DEFAULT '[]';
