/*
  Warnings:

  - A unique constraint covering the columns `[user_name]` on the table `tb_user` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "tb_user_user_name_key" ON "public"."tb_user"("user_name");
