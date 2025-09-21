import Elysia from "elysia";
import { guestController } from "../controllers/guest.controller";

export const guestRoute = new Elysia({ prefix: "/guest" })
  .get("/get-ctg", guestController.get_ctg)
  .get("/get-products", guestController.get_products)
  .get("/product-cart/:productIds", guestController.product_cart)
  .get("/product/:pro_id", guestController.product_by_id)
  .get("/same-ctg-product/:ctg_id", guestController.get_sameCtg_product)
  .get("/notsame-ctg-product/:pro_id", guestController.get_other_product)
  .get("/search-product", guestController.get_all_product)
