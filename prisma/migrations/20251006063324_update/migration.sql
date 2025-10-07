/*
  Warnings:

  - You are about to drop the column `code` on the `tb_promotion` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."tb_promotion_code_key";

-- AlterTable
ALTER TABLE "public"."tb_promotion" DROP COLUMN "code",
ADD COLUMN     "promotion_type" TEXT,
ALTER COLUMN "discount" SET DATA TYPE TEXT;
