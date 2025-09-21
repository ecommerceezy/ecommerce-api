/*
  Warnings:

  - You are about to drop the column `ctg_id` on the `tb_product` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."tb_product" DROP CONSTRAINT "tb_product_ctg_id_fkey";

-- AlterTable
ALTER TABLE "public"."tb_product" DROP COLUMN "ctg_id";

-- CreateTable
CREATE TABLE "public"."_ProductCategories" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ProductCategories_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ProductCategories_B_index" ON "public"."_ProductCategories"("B");

-- AddForeignKey
ALTER TABLE "public"."_ProductCategories" ADD CONSTRAINT "_ProductCategories_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."tb_category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_ProductCategories" ADD CONSTRAINT "_ProductCategories_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."tb_product"("pro_id") ON DELETE CASCADE ON UPDATE CASCADE;
