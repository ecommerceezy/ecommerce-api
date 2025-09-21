/*
  Warnings:

  - You are about to drop the column `tb_productPro_id` on the `tb_pro_img` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."tb_pro_img" DROP CONSTRAINT "tb_pro_img_tb_productPro_id_fkey";

-- AlterTable
ALTER TABLE "public"."tb_pro_img" DROP COLUMN "tb_productPro_id";
