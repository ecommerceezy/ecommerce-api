-- AlterTable
ALTER TABLE "public"."tb_product" ADD COLUMN     "unit" TEXT;

-- AlterTable
ALTER TABLE "public"."tb_user" ADD COLUMN     "bank_name" TEXT,
ADD COLUMN     "bank_number" TEXT,
ADD COLUMN     "bank_owner" TEXT;

-- CreateTable
CREATE TABLE "public"."tb_user_address" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "address" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "sub_district" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "zipcode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tb_user_address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tb_promotion" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "discount" DOUBLE PRECISION NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "product_id" INTEGER NOT NULL,

    CONSTRAINT "tb_promotion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tb_user_address_user_id_key" ON "public"."tb_user_address"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "tb_promotion_code_key" ON "public"."tb_promotion"("code");

-- CreateIndex
CREATE UNIQUE INDEX "tb_promotion_product_id_key" ON "public"."tb_promotion"("product_id");

-- AddForeignKey
ALTER TABLE "public"."tb_user_address" ADD CONSTRAINT "tb_user_address_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."tb_user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tb_promotion" ADD CONSTRAINT "tb_promotion_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."tb_product"("pro_id") ON DELETE RESTRICT ON UPDATE CASCADE;
