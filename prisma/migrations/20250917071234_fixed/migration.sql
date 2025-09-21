/*
  Warnings:

  - The primary key for the `tb_billorder` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[bill_id]` on the table `tb_billorder` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "public"."tb_orderdetails" DROP CONSTRAINT "tb_orderdetails_bill_id_fkey";

-- AlterTable
ALTER TABLE "public"."tb_billorder" DROP CONSTRAINT "tb_billorder_pkey",
ALTER COLUMN "bill_id" DROP DEFAULT,
ALTER COLUMN "bill_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "tb_billorder_pkey" PRIMARY KEY ("bill_id");
DROP SEQUENCE "tb_billorder_bill_id_seq";

-- AlterTable
ALTER TABLE "public"."tb_orderdetails" ALTER COLUMN "bill_id" SET DATA TYPE TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "tb_billorder_bill_id_key" ON "public"."tb_billorder"("bill_id");

-- AddForeignKey
ALTER TABLE "public"."tb_orderdetails" ADD CONSTRAINT "tb_orderdetails_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "public"."tb_billorder"("bill_id") ON DELETE RESTRICT ON UPDATE CASCADE;
