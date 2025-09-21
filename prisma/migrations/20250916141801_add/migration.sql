/*
  Warnings:

  - You are about to drop the column `pro_img` on the `tb_product` table. All the data in the column will be lost.
  - Added the required column `sell_count` to the `tb_product` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."tb_product" DROP COLUMN "pro_img",
ADD COLUMN     "sell_count" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "public"."tb_pro_img" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tb_productPro_id" INTEGER,

    CONSTRAINT "tb_pro_img_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."tb_pro_img" ADD CONSTRAINT "tb_pro_img_tb_productPro_id_fkey" FOREIGN KEY ("tb_productPro_id") REFERENCES "public"."tb_product"("pro_id") ON DELETE SET NULL ON UPDATE CASCADE;
