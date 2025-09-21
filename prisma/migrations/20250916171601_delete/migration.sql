-- DropForeignKey
ALTER TABLE "public"."tb_product" DROP CONSTRAINT "tb_product_ctg_id_fkey";

-- AlterTable
ALTER TABLE "public"."tb_pro_img" ADD COLUMN     "tb_productPro_id" INTEGER;

-- AlterTable
ALTER TABLE "public"."tb_product" ALTER COLUMN "ctg_id" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "public"."tb_pro_img" ADD CONSTRAINT "tb_pro_img_tb_productPro_id_fkey" FOREIGN KEY ("tb_productPro_id") REFERENCES "public"."tb_product"("pro_id") ON DELETE SET NULL ON UPDATE CASCADE;
