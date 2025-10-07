/*
  Warnings:

  - You are about to drop the column `product_id` on the `tb_promotion` table. All the data in the column will be lost.
  - You are about to drop the column `promotion_type` on the `tb_promotion` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."tb_promotion" DROP CONSTRAINT "tb_promotion_product_id_fkey";

-- DropIndex
DROP INDEX "public"."tb_promotion_product_id_key";

-- AlterTable
ALTER TABLE "public"."tb_product" ADD COLUMN     "promotion_id" INTEGER;

-- AlterTable
ALTER TABLE "public"."tb_promotion" DROP COLUMN "product_id",
DROP COLUMN "promotion_type";

-- AddForeignKey
ALTER TABLE "public"."tb_product" ADD CONSTRAINT "tb_product_promotion_id_fkey" FOREIGN KEY ("promotion_id") REFERENCES "public"."tb_promotion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
