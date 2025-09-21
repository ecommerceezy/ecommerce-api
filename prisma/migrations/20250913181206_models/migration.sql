-- CreateTable
CREATE TABLE "public"."tb_role" (
    "role_id" SERIAL NOT NULL,
    "role_name" TEXT NOT NULL,
    "role_status" TEXT,
    "role_des" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tb_role_pkey" PRIMARY KEY ("role_id")
);

-- CreateTable
CREATE TABLE "public"."tb_user" (
    "user_id" SERIAL NOT NULL,
    "user_name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "title_type" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "birth_date" TIMESTAMP(3) NOT NULL,
    "tel" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "ctn_status" TEXT NOT NULL,
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "roleId" INTEGER NOT NULL,

    CONSTRAINT "tb_user_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "public"."tb_product" (
    "pro_id" SERIAL NOT NULL,
    "pro_name" TEXT NOT NULL,
    "pro_img" TEXT NOT NULL,
    "pro_price" DOUBLE PRECISION NOT NULL,
    "freight" DOUBLE PRECISION NOT NULL,
    "pro_number" INTEGER NOT NULL,
    "pro_color" TEXT NOT NULL,
    "pro_size" TEXT NOT NULL,
    "pro_details" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tb_product_pkey" PRIMARY KEY ("pro_id")
);

-- CreateTable
CREATE TABLE "public"."tb_billorder" (
    "bill_id" SERIAL NOT NULL,
    "bill_date" TIMESTAMP(3) NOT NULL,
    "bill_pm" TIMESTAMP(3),
    "bill_freighttotal" DOUBLE PRECISION NOT NULL,
    "bill_totalamount" DOUBLE PRECISION NOT NULL,
    "bill_price" DOUBLE PRECISION NOT NULL,
    "status_pm" TEXT NOT NULL,
    "pm_method" TEXT NOT NULL,
    "slip_pm" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "tb_billorder_pkey" PRIMARY KEY ("bill_id")
);

-- CreateTable
CREATE TABLE "public"."tb_orderdetails" (
    "detail_id" SERIAL NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit" TEXT NOT NULL,
    "total_amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "bill_id" INTEGER NOT NULL,
    "pro_id" INTEGER NOT NULL,

    CONSTRAINT "tb_orderdetails_pkey" PRIMARY KEY ("detail_id")
);

-- AddForeignKey
ALTER TABLE "public"."tb_user" ADD CONSTRAINT "tb_user_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."tb_role"("role_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tb_billorder" ADD CONSTRAINT "tb_billorder_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."tb_user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tb_orderdetails" ADD CONSTRAINT "tb_orderdetails_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "public"."tb_billorder"("bill_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tb_orderdetails" ADD CONSTRAINT "tb_orderdetails_pro_id_fkey" FOREIGN KEY ("pro_id") REFERENCES "public"."tb_product"("pro_id") ON DELETE RESTRICT ON UPDATE CASCADE;
