/*
  Warnings:

  - You are about to drop the column `createdAt` on the `tb_pro_img` table. All the data in the column will be lost.
  - You are about to drop the column `tb_productPro_id` on the `tb_pro_img` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `tb_pro_img` table. All the data in the column will be lost.
  - Changed the type of `ctg_id` on the `tb_product` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "public"."tb_pro_img" DROP CONSTRAINT "tb_pro_img_tb_productPro_id_fkey";

-- AlterTable
ALTER TABLE "public"."tb_pro_img" DROP COLUMN "createdAt",
DROP COLUMN "tb_productPro_id",
DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "public"."tb_product" DROP COLUMN "ctg_id",
ADD COLUMN     "ctg_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."tb_product" ADD CONSTRAINT "tb_product_ctg_id_fkey" FOREIGN KEY ("ctg_id") REFERENCES "public"."tb_category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
