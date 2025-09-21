-- AlterTable
ALTER TABLE "public"."tb_category" ADD COLUMN     "img" TEXT;

-- AlterTable
ALTER TABLE "public"."tb_user" ADD COLUMN     "allowed" BOOLEAN NOT NULL DEFAULT true;
