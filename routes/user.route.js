import Elysia from "elysia";
import { userController } from "../controllers/user.controller";
import { middleware } from "../middleware/auth.middleware";

export const userRoute = new Elysia({ prefix: "/user" })
  .get("/get-info", userController.getInfo, { beforeHandle: middleware.auth })
  .post("/update-info", userController.updateProfile, {
    beforeHandle: middleware.auth,
  })
  // by user id
  .get("/get-address", userController.getAddress, {
    beforeHandle: middleware.auth,
  })
  .get("/get-address-id/:id", userController.get_address_by_id, {
    beforeHandle: middleware.auth,
  })
  .post("/add-address", userController.addAddress, {
    beforeHandle: middleware.auth,
  })
  .post("/update-address/:id", userController.updateAddress, {
    beforeHandle: middleware.auth,
  })
  .put("/change-pass", userController.change_password, {
    beforeHandle: middleware.auth,
  })
  .get("/check-out-data", userController.get_checkout_data, {
    beforeHandle: middleware.auth,
  })
  .get("/qrcode-promptpay/:amount", userController.qrcode_promptpay, {
    beforeHandle: middleware.auth,
  })
  .post("/create-order", userController.create_order, {
    beforeHandle: middleware.auth,
  })
  .get("/get-order-history", userController.get_order_history, {
    beforeHandle: middleware.auth,
  })
  .get("/order-detail/:orderid", userController.get_order_id, {
    beforeHandle: middleware.auth,
  })
  .put("/update-slip/:orderid", userController.update_slip, {
    beforeHandle: middleware.auth,
  })
  .put("/update-order-status", userController.update_order_status, {
    beforeHandle: middleware.auth,
  })
  .get("/get-bank", userController.get_bank, { beforeHandle: middleware.auth })
  .put("/update-bank", userController.update_bank, {
    beforeHandle: middleware.auth,
  });
