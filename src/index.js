import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import jwt from "@elysiajs/jwt";
import "dotenv/config";
import staticPlugin from "@elysiajs/static";
import { authRoute } from "../routes/auth.route";
import { userRoute } from "../routes/user.route";
import { adminRoute } from "../routes/admin/admin.route";
import { guestRoute } from "../routes/guest.route";

const app = new Elysia({ prefix: "/api" })
  .use(
    cors({
      origin: ["http://localhost:4000", "http://localhost:3000"],
      credentials: true,
    })
  )
  .use(
    jwt({
      secret: process.env.JWT_SECRET,
      name: "jwt",
      exp: "3d",
    })
  )
  .use(
    staticPlugin({
      prefix: "/",
      assets: "./public",
    })
  )

  .use(guestRoute)
  .use(authRoute)
  .use(userRoute)
  .use(adminRoute)

  .get("/", () => "hello")
  .listen(process.env.PORT || 8000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
