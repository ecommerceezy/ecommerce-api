import Elysia from "elysia";
import { adminController } from "../../controllers/admin/admin.controller";
import { middleware } from "../../middleware/auth.middleware";

export const adminRoute = new Elysia({ prefix: "/admin" })
  .get("/get-ctg", adminController.get_ctg, {
    beforeHandle: middleware.auth_admin,
  })
  .post("/create-ctg", adminController.create_ctg, {
    beforeHandle: middleware.auth_admin,
  })
  .post("/update-ctg/:ctgid", adminController.update_ctg, {
    beforeHandle: middleware.auth_admin,
  })
  .delete("/delete-ctg/:ctgid", adminController.delete_ctg, {
    beforeHandle: middleware.auth_admin,
  })
  .post("/create-product", adminController.create_product, {
    beforeHandle: middleware.auth_admin,
  })
  .get("/get-product-list", adminController.product_list, {
    beforeHandle: middleware.auth_admin,
  })
  .get("/product-avg", adminController.product_avg, {
    beforeHandle: middleware.auth_admin,
  })
  .delete("/delete-product/:pro_id", adminController.delete_product, {
    beforeHandle: middleware.auth_admin,
  })
  .post("/update-product/:pro_id", adminController.update_product, {
    beforeHandle: middleware.auth,
  })
  .get("/get-orders", adminController.get_orders, {
    beforeHandle: middleware.auth_admin,
  })
  .get("/orders-avg", adminController.get_order_avg, {
    beforeHandle: middleware.auth_admin,
  })
  .get("/order-detail/:orderid", adminController.get_order_detail, {
    beforeHandle: middleware.auth_admin,
  })
  .put("/update-order-status", adminController.update_order_status, {
    beforeHandle: middleware.auth_admin,
  })
  .get("/dashboard-avg", adminController.get_dashbaord_avg, {
    beforeHandle: middleware.auth_admin,
  })
  .get("/dashboard-lastest-order", adminController.dashboard_lastest_order, {
    beforeHandle: middleware.auth_admin,
  })
  .get("/dashbaord-product", adminController.dashbaord_product, {
    beforeHandle: middleware.auth_admin,
  })
  .get("/dashbaord-members", adminController.dashbaord_members, {
    beforeHandle: middleware.auth_admin,
  })
  .get("/dashboard-report", adminController.sell_reports, {
    beforeHandle: middleware.auth_admin,
  })
  .get("/members", adminController.get_members, {
    beforeHandle: middleware.auth_admin,
  })
  .post("/create-member", adminController.create_members, {
    beforeHandle: middleware.auth_admin,
  })
  .get("/members/avg", adminController.members_avg, {
    beforeHandle: middleware.auth_admin,
  })
  .put("/toggle-member", adminController.toggle_member, {
    beforeHandle: middleware.auth_admin,
  })
  .post("/add-banner", adminController.add_banner, {
    beforeHandle: middleware.auth_admin,
  })
  .post("/edit-banner/:bannerid", adminController.edit_banner, {
    beforeHandle: middleware.auth_admin,
  })
  .delete("/delete-banner/:bannerid", adminController.delete_banner, {
    beforeHandle: middleware.auth_admin,
  })
  .put("/update-slip-return/:orderid", adminController.update_slip_return, {
    beforeHandle: middleware.auth_admin,
  })
  .get(
    "/product-promotion-options",
    adminController.product_promotion_options,
    {
      beforeHandle: middleware.auth_admin,
    }
  )
  .post("/new-promotion", adminController.new_promotion, {
    beforeHandle: middleware.auth_admin,
  })
  .get("/promotions", adminController.get_promotions, {
    beforeHandle: middleware.auth_admin,
  })
  .get("/promotion-avg", adminController.get_promotion_avg, {
    beforeHandle: middleware.auth_admin,
  })
  .delete("/delete-promotion/:promotionId", adminController.delete_promotion, {
    beforeHandle: middleware.auth_admin,
  })
  .get("/promotion/:promotionId", adminController.get_promotion_id, {
    beforeHandle: middleware.auth_admin,
  })
  .post(
    "/update-promotion/:promotionId",
    adminController.update_promotion,
    { beforeHandle: middleware.auth_admin }
  );
