/*
  Warnings:

  - Added the required column `ctg_id` to the `tb_product` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."tb_product" ADD COLUMN     "ctg_id" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "public"."tb_category" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "remark" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tb_category_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."tb_product" ADD CONSTRAINT "tb_product_ctg_id_fkey" FOREIGN KEY ("ctg_id") REFERENCES "public"."tb_category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
