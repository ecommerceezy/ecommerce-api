import Elysia from "elysia";
import { authController } from "../controllers/auth.controller";
import { middleware } from "../middleware/auth.middleware";

export const authRoute = new Elysia({ prefix: "/auth" })
  .post("/create-user", authController.createUser)
  .get("/get-login-user", authController.checkLogin, {
    beforeHandle: middleware.auth,
  })
  .post("/login", authController.login)
  .post("/logout", authController.logout, { beforeHandle: middleware.auth })
  .post("/forgot-pass/checkuser", authController.forgotpass_checkuser)
  .put("/forgot-pass/update-pass", authController.fotgotpass_updatePass);
