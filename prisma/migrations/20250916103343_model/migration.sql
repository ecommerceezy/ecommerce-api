/*
  Warnings:

  - Added the required column `status` to the `tb_category` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."tb_category" ADD COLUMN     "status" TEXT NOT NULL;
