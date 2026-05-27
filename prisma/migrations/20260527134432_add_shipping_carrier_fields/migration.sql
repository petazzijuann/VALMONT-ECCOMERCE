-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "shipping_carrier" TEXT,
ADD COLUMN     "shipping_carrier_name" TEXT,
ADD COLUMN     "shipping_service_id" TEXT;
