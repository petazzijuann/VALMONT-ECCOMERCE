-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "andreani_order_id" TEXT,
ADD COLUMN     "andreani_tracking_id" TEXT,
ADD COLUMN     "shipping_cost" DECIMAL(12,2),
ADD COLUMN     "shipping_cp" TEXT,
ADD COLUMN     "shipping_days_label" TEXT,
ADD COLUMN     "shipping_method" TEXT,
ALTER COLUMN "total_amount" SET DATA TYPE DECIMAL(12,2);
