import { PrismaClient } from "../../src/generated/prisma";
import path from "path";
import { unlink } from "fs/promises";
import { existsSync } from "fs";
import {
  uploadImages,
  validateCategories,
  validateProductData,
} from "../../libs/helper-admin";
import { transporter } from "../../config/config";
import bcrytpjs from "bcryptjs";
import { t } from "elysia";

const prisma = new PrismaClient();

export const adminController = {
  get_ctg: async ({ set, query }) => {
    try {
      const { search, page, forProduct } = query;
      let take = 10;
      let skip = 0;

      let filter = {};
      if (search) {
        filter = {
          OR: [
            {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              remark: {
                contains: search,
                mode: "insensitive",
              },
            },
          ],
        };
      }

      if (forProduct) {
        filter = {
          status: "1",
          ...filter,
        };
      }

      if (page) {
        skip = take * (page - 1);
      }

      // query options
      const queryOptions = {
        where: {
          ...filter,
        },
        select: {
          id: true,
          name: true,
          status: true,
          img: true,
          remark: true,
          _count: {
            select: {
              products: true,
            },
          },
        },
        orderBy: {
          id: "desc",
        },
      };

      // ถ้า forProduct ให้ดึงทั้งหมด ไม่ต้องใส่ take/skip
      if (!forProduct) {
        queryOptions.take = take;
        queryOptions.skip = skip;
      }

      const [data, total] = await Promise.all([
        prisma.tb_category.findMany(queryOptions),
        prisma.tb_category.count({
          where: {
            ...filter,
          },
        }),
      ]);

      set.status = 200;
      return {
        data,
        totalPage: forProduct
          ? 1 // ถ้าดึงทั้งหมดไม่ต้องมีการแบ่งหน้า
          : Math.ceil(total / take) < 1
          ? 1
          : Math.ceil(total / take),
        total,
      };
    } catch (error) {
      console.error(error);
      set.status = 500;
      return { error: error.message };
    }
  },
  create_ctg: async ({ body, set }) => {
    try {
      const { name, remark, status, img: file } = body;
      if (!name || !remark || !status) {
        return (set.status = 400);
      }

      // create image
      const imgName = `${Date.now()}_${file.name?.replace(/\s+/g, "")}`;
      await Bun.write(`./public/upload/${imgName}`, file);

      const create = await prisma.tb_category.create({
        data: {
          status: `${body.status}`,
          name,
          remark,
          img: imgName,
        },
      });
      if (!create) return (set.status = 400);

      set.status = 200;
      return { ok: true };
    } catch (error) {
      console.error(error);
      return (set.status = 500);
    }
  },
  update_ctg: async ({ body, set, params }) => {
    try {
      const { ctgid } = params;
      if (!ctgid) return (set.status = 400);
      const { name, remark, status, img: file, changeImage } = body;

      const oldImage = await prisma.tb_category.findUnique({
        where: { id: Number(ctgid) },
        select: { img: true },
      });
      let imgName = oldImage.img;
      if (changeImage && imgName) {
        const imgPath = path.join(
          import.meta.dir,
          "../../public/upload",
          imgName
        );
        if (existsSync(imgPath)) {
          try {
            await unlink(imgPath);
            console.log("Successfully deleted:", imgPath);
          } catch (error) {
            console.error("Error deleting file:", error);
          }
        }
      }

      if (file) {
        imgName = `${Date.now()}_${file.name?.replace(/\s+/g, "")}`;
        await Bun.write(`./public/upload/${imgName}`, file);
      }

      const update = await prisma.tb_category.update({
        where: {
          id: Number(ctgid),
        },
        data: {
          status: `${status}`,
          name,
          remark,
          img: imgName,
        },
      });
      if (!update) return (set.status = 400);

      set.status = 200;
      return { ok: true };
    } catch (error) {
      console.error(error);
      return (set.status = 500);
    }
  },
  delete_ctg: async ({ set, params }) => {
    try {
      const { ctgid } = params;
      if (!ctgid) return (set.status = 400);

      const oldImage = await prisma.tb_category.findUnique({
        where: { id: Number(ctgid) },
        select: { img: true },
      });
      const imgPath = path.join(
        import.meta.dir,
        "../../public/upload",
        oldImage.img
      );
      if (existsSync(imgPath)) {
        try {
          await unlink(imgPath);
          console.log("Successfully deleted:", imgPath);
        } catch (error) {
          console.error("Error deleting file:", error);
        }
      }

      const del = await prisma.tb_category.delete({
        where: {
          id: Number(ctgid),
        },
      });

      if (!del) return (set.status = 400);

      set.status = 200;
      return { ok: true };
    } catch (error) {
      console.error(error);
      return (set.status = 500);
    }
  },
  create_product: async ({ body, set }) => {
    try {
      // 1. Validate input data
      validateProductData(body);

      // 2. Extract and process data
      const {
        name,
        remark,
        pro_name,
        pro_price,
        freight,
        pro_number,
        pro_color,
        pro_size,
        pro_details,
        categories,
        unit,
        "images[]": images,
        ...rest
      } = body;

      // Parse category IDs
      const categoryIds = categories
        .split(",")
        .map((id) => parseInt(id.trim(), 10))
        .filter((id) => !isNaN(id));

      if (categoryIds.length === 0) {
        throw new Error("No valid category IDs provided");
      }

      // 3. Process everything in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Validate categories exist
        await validateCategories(categoryIds, tx);

        // Upload images
        const imageUrls = await uploadImages(images);

        // ✅ Create product + many-to-many categories
        const product = await tx.tb_product.create({
          data: {
            unit,
            pro_name: pro_name.trim(),
            pro_price: Number(pro_price),
            freight: Number(freight),
            pro_number: Number(pro_number),
            pro_color: pro_color?.trim() || "",
            pro_size: pro_size?.trim() || "",
            pro_details: pro_details?.trim() || "",
            sell_count: 0,
            imgs: {
              create: imageUrls.map((url) => ({ url })),
            },
            categories: {
              connect: categoryIds.map((id) => ({ id })), // ✅ many-to-many
            },
          },
          include: {
            imgs: true,
            categories: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        return {
          product,
          totalImages: imageUrls.length,
          categories: categoryIds,
        };
      });

      return {
        success: true,
        data: result.product,
        message: `Product created successfully with ${result.totalImages} images`,
        metadata: {
          totalImages: result.totalImages,
          categories: result.categories,
        },
      };
    } catch (error) {
      if (
        error.message.includes("Validation errors") ||
        error.message.includes("Categories") ||
        error.message.includes("required")
      ) {
        set.status = 400;
      } else if (error.message.includes("not found")) {
        set.status = 404;
      } else {
        set.status = 500;
      }

      return {
        success: false,
        error: error.message,
        message: "Failed to create product",
      };
    }
  },
  product_list: async ({ set, query }) => {
    try {
      const { search, searchCtg, sort, take, page } = query;
      const skip = Number(take) * (page - 1);

      let filter = {};
      if (search && isNaN(Number(search))) {
        // 👉 search เป็น string (ไม่สามารถแปลงเป็น number ได้)
        filter = {
          OR: [
            {
              pro_name: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              pro_color: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              pro_size: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              pro_details: {
                contains: search,
                mode: "insensitive",
              },
            },
          ],
        };
      } else if (search && !isNaN(Number(search))) {
        // 👉 search เป็นตัวเลข (สามารถแปลงเป็น number ได้)
        filter = {
          OR: [
            { pro_price: { equals: Number(search) } },
            { freight: { equals: Number(search) } },
            { pro_number: { equals: Number(search) } },
            { sell_count: { equals: Number(search) } },
          ],
        };
      }

      if (searchCtg) {
        filter = {
          categories: {
            some: {
              id: Number(searchCtg),
            },
          },
          ...filter,
        };
      }

      const [products, total] = await Promise.all([
        prisma.tb_product.findMany({
          take: Number(take),
          skip,
          where: {
            ...filter,
          },
          select: {
            categories: {
              select: {
                name: true,
                id: true,
              },
            },
            imgs: {
              select: {
                id: true,
                url: true,
              },
            },
            pro_id: true,
            pro_name: true,
            pro_price: true,
            pro_color: true,
            pro_size: true,
            freight: true,
            pro_details: true,
            pro_number: true,
            sell_count: true,
            unit: true,
          },
          orderBy: {
            ...JSON.parse(sort),
          },
        }),
        prisma.tb_product.count({
          where: {
            ...filter,
          },
        }),
      ]);

      set.status = 200;
      return {
        products,
        total,
        totalPage: Math.ceil(total / take) < 1 ? 1 : Math.ceil(total / take),
      };
    } catch (error) {
      console.error(error);
      set.status = 500;
      return { error: "เกิดข้อผิดพลาดภายในระบบ" };
    }
  },
  product_avg: async ({ set }) => {
    try {
      const [allList, allSell] = await Promise.all([
        prisma.tb_product.aggregate({
          _count: {
            pro_id: true,
          },
          _sum: {
            pro_number: true,
          },
        }),
        prisma.tb_product.aggregate({
          _sum: {
            sell_count: true,
          },
        }),
      ]);

      set.status = 200;
      return {
        allList: allList._count.pro_id,
        allStock: allList._sum.pro_number,
        allSell: allSell._sum.sell_count,
      };
    } catch (error) {
      console.error(error);
      return (set.status = 500);
    }
  },
  delete_product: async ({ set, params }) => {
    try {
      const { pro_id } = params;
      if (!pro_id) return (set.status = 400);

      const imgs = await prisma.tb_pro_img.findMany({
        where: {
          tb_productPro_id: Number(pro_id),
        },
        select: {
          url: true,
        },
      });

      const imgsArr = imgs.map((img) => img.url);

      // ลบรูปจากโฟลเดอร์
      for (const url of imgsArr) {
        const imgPath = path.join(import.meta.dir, "../../public/upload", url);
        if (existsSync(imgPath)) {
          try {
            await unlink(imgPath);
            console.log("Successfully deleted:", imgPath);
          } catch (error) {
            console.error("Error deleting file:", error);
          }
        }
      }

      // // ลบจากตารางรูปภาพ
      await prisma.$transaction([
        prisma.tb_pro_img.deleteMany({
          where: { tb_productPro_id: Number(pro_id) },
        }),
        prisma.tb_product.delete({
          where: { pro_id: Number(pro_id) },
        }),
      ]);

      set.status = 200;
      return { ok: true };
    } catch (error) {
      console.error(error);
      return (set.status = 500);
    }
  },
  update_product: async ({ set, body, params }) => {
    try {
      const { pro_id } = params;
      if (!pro_id) return (set.status = 400);

      const {
        unit,
        name,
        remark,
        pro_name,
        pro_price,
        freight,
        pro_number,
        pro_color,
        pro_size,
        pro_details,
        categories,
        "images[]": images,
        deleteImgs,
        ...rest
      } = body;

      const result = await prisma.$transaction(async (tx) => {
        // Parse and validate category IDs
        const categoryIds = categories
          .split(",")
          .map((id) => parseInt(id.trim(), 10))
          .filter((id) => !isNaN(id));
        await validateCategories(categoryIds, tx);

        // Get existing images
        const existingImgs = await tx.tb_pro_img.findMany({
          where: {
            tb_productPro_id: Number(pro_id),
          },
          select: {
            id: true,
            url: true,
          },
        });

        // Handle image deletions
        let imagesToDelete = [];
        if (deleteImgs) {
          const deleteIds = deleteImgs
            .split(",")
            .map((d) => Number(d))
            .filter((id) => !isNaN(id));

          imagesToDelete = existingImgs.filter((img) =>
            deleteIds.includes(img.id)
          );

          // Delete files from filesystem
          for (const { url } of imagesToDelete) {
            const imgPath = path.join(
              import.meta.dir,
              "../../public/upload",
              url
            );
            if (existsSync(imgPath)) {
              try {
                await unlink(imgPath);
                console.log("Successfully deleted:", imgPath);
              } catch (error) {
                console.error("Error deleting file:", error);
              }
            }
          }

          // Delete from database
          await tx.tb_pro_img.deleteMany({
            where: {
              id: {
                in: deleteIds,
              },
            },
          });
        }

        // Upload new images
        let newImageUrls = [];
        if (images) {
          const imageArray = Array.isArray(images) ? images : [images];

          for (const file of imageArray) {
            const imgName = `${Date.now()}_${file?.name?.replace(/\s+/g, "")}`;
            await Bun.write(`./public/upload/${imgName}`, file);
            newImageUrls.push(imgName);
          }

          // Create new image records
          if (newImageUrls.length > 0) {
            await tx.tb_pro_img.createMany({
              data: newImageUrls.map((url) => ({
                url,
                tb_productPro_id: Number(pro_id),
              })),
            });
          }
        }

        // Update product with category relationships
        const update = await tx.tb_product.update({
          where: {
            pro_id: Number(pro_id),
          },
          data: {
            unit,
            pro_name: pro_name.trim(),
            pro_price: Number(pro_price),
            freight: Number(freight),
            pro_number: Number(pro_number),
            pro_color: pro_color?.trim() || "",
            pro_size: pro_size?.trim() || "",
            pro_details: pro_details?.trim() || "",
            sell_count: 0,
            categories: {
              set: categoryIds.map((id) => ({ id })), // Replace all categories
            },
          },
          include: {
            imgs: true,
            categories: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        if (!update) {
          throw new Error("Failed to update product");
        }

        return update;
      });

      set.status = 200;
      return { ok: true, data: result };
    } catch (error) {
      console.error("Update product error:", error);
      set.status = 500;
      return {
        ok: false,
        error: error.message || "Internal server error",
      };
    }
  },
  get_orders: async ({ set, query }) => {
    try {
      const { status, sort, page, take, search } = query;
      const skip = Number(take) * (page - 1);
      let filter = {};
      if (search) {
        filter = {
          OR: [
            {
              bill_id: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              user: {
                first_name: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            },
            {
              user: {
                title_type: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            },
            {
              user: {
                last_name: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            },
          ],
        };
      }
      if (status === "cancel") {
        filter = {
          ...filter,
          OR: [
            {
              status_pm: "cancel",
            },
            {
              status_pm: {
                contains: "return",
              },
            },
          ],
        };
      } else if (status !== "all") {
        filter = {
          ...filter,
          status_pm: status,
        };
      }

      const [data, total] = await Promise.all([
        prisma.tb_billorder.findMany({
          take: Number(take),
          skip,
          where: {
            ...filter,
          },
          select: {
            bill_id: true,
            pm_method: true,
            bill_productList: true,
            bill_productPeace: true,
            user: {
              select: {
                title_type: true,
                first_name: true,
                last_name: true,
                tel: true,
              },
            },
            bill_date: true,
            bill_price: true,
            status_pm: true,
          },
          orderBy: {
            ...JSON.parse(sort),
          },
        }),
        prisma.tb_billorder.count({
          where: {
            ...filter,
          },
        }),
      ]);

      set.status = 200;
      return {
        data,
        total,
        totalPage: Math.ceil(total / take) < 1 ? 1 : Math.ceil(total / take),
      };
    } catch (error) {
      console.error("Update product error:", error);
      set.status = 500;
      return {
        ok: false,
        error: error.message || "Internal server error",
      };
    }
  },
  get_order_avg: async ({ set }) => {
    try {
      const [
        allOrders,
        allPending,
        allRecevied,
        allCancel,
        allSending,
        allReturnPending,
      ] = await Promise.all([
        prisma.tb_billorder.count(),
        prisma.tb_billorder.count({
          where: {
            status_pm: "pending",
          },
        }),
        prisma.tb_billorder.count({
          where: {
            status_pm: "recevied",
          },
        }),
        prisma.tb_billorder.count({
          where: {
            OR: [
              {
                status_pm: "cancel",
              },
              {
                status_pm: {
                  contains: "return",
                },
              },
            ],
          },
        }),
        prisma.tb_billorder.count({
          where: {
            status_pm: "sending",
          },
        }),
        prisma.tb_billorder.count({
          where: {
            status_pm: "return_pending",
          },
        }),
      ]);

      set.status = 200;
      return {
        allOrders,
        allPending,
        allRecevied,
        allCancel,
        allSending,
        allReturnPending,
      };
    } catch (error) {
      console.error(error);
      set.status = 500;
      return { success: false, error: error.message };
    }
  },
  get_order_detail: async ({ set, params }) => {
    try {
      const { orderid } = params;
      if (!orderid) return (set.status = 400);

      const data = await prisma.tb_billorder.findUnique({
        where: {
          bill_id: orderid,
        },
        select: {
          bill_id: true,
          status_pm: true,
          bill_date: true,
          pm_method: true,
          bill_productPeace: true,
          bill_totalDiscount: true,
          slip_return: true,
          order_details: {
            select: {
              detail_id: true,
              quantity: true,
              total_amount: true,
              color: true,
              size: true,
              product: {
                select: {
                  pro_name: true,
                  imgs: {
                    take: 1,
                    select: {
                      url: true,
                    },
                  },
                },
              },
            },
          },
          bill_totalamount: true,
          bill_freighttotal: true,
          slip_pm: true,
          bill_pm: true,
          bill_price: true,
          user: {
            select: {
              title_type: true,
              first_name: true,
              last_name: true,
              tel: true,
              email: true,
              bank_name: true,
              bank_number: true,
              bank_owner: true,
              tb_user_address: {
                take: 1,
                where: {
                  is_using: true,
                },
                select: {
                  province: true,
                  address: true,
                  district: true,
                  phone: true,
                  sub_district: true,
                  zipcode: true,
                },
              },
            },
          },
        },
      });

      set.status = 200;
      return data;
    } catch (error) {
      console.error(error);
      set.status = 500;
      return { success: false, error: error.message };
    }
  },
  update_order_status: async ({ set, body, store }) => {
    try {
      const { status, orderId } = body;
      if (!status || !orderId) return (set.status = 400);

      const update = await prisma.tb_billorder.update({
        where: {
          bill_id: orderId,
        },
        data: {
          status_pm: status,
        },
        select: {
          user: {
            select: {
              email: true,
            },
          },
        },
      });
      if (!update) return (set.status = 400);

      let html = ``;
      let subject = ``;
      let text = ``;

      if (status === "cancel") {
        // แจ้งเตือนร้านเมื่อลูกค้ายกเลิกสินค้า
        subject = "❌ คำสั่งซื้อถูกยกเลิก";
        text = "ร้านได้ทำการยกเลิกคำสั่งซื้อ โปรดตรวจสอบในระบบ";
        html = `
        <div style="font-family: Arial, sans-serif; line-height:1.6; color:#333;">
          <h2 style="color:#e74c3c;">❌ คำสั่งซื้อถูกยกเลิก</h2>
    
          <p>ลูกค้าได้ทำการ <strong style="color:#e74c3c;">ยกเลิกคำสั่งซื้อ รหัสคำสั่งซื้อ ${orderId}</strong> แล้ว กรุณาตรวจสอบในระบบเพื่อยืนยันการเปลี่ยนแปลง</p>
    
          <hr style="margin:20px 0; border:none; border-top:1px solid #ddd;">
          <p style="font-size:12px; color:#888;">อีเมลนี้เป็นการแจ้งเตือนอัตโนมัติ กรุณาอย่าตอบกลับ</p>
        </div>
      `;
      } else {
        subject = "✅ คำสั่งซื้อได้รับการยืนยันแล้ว ";
        text =
          "ร้านยืนยันคำสั่งซื้อแล้ว ขณะนี้อยู่ระหว่างการจัดส่ง โปรดตรวจสอบคำสั่งซื้อ";
        html = `
        <div style="font-family: Arial, sans-serif; line-height:1.6; color:#333;">
          <h2 style="color:#27ae60;">✅ ยืนยันคำสั่งซื้อแล้ว</h2>
          <p style="margin-top:5px">ร้านยืนยันคำสั่งซื้อแล้ว ขณะนี้อยู่ระหว่างการจัดส่ง โปรดตรวจสอบคำสั่งซื้อ</p>
    
          <p>ร้านด้า <strong style="color:#27ae60;">ยืนยันคำสั่งซื้อของคุณ</strong> เรียบร้อยแล้ว</p>
            <p>รหัสคำสั่งซื้อ : ${orderId}</p>
          </p>
          <hr style="margin:20px 0; border:none; border-top:1px solid #ddd;">
          <p style="font-size:12px; color:#888;">อีเมลนี้เป็นการแจ้งเตือนอัตโนมัติ กรุณาอย่าตอบกลับ</p>
        </div>
      `;
      }

      const mailOptions = {
        form: "ecommerceezy@gmail.com",
        to: update.user.email,
        subject,
        text,
        html,
      };

      await transporter.sendMail(mailOptions);

      set.status = 200;
      return { ok: true };
    } catch (error) {
      console.error(error);
      set.status = 500;
      return { success: false, error: error.message };
    }
  },
  get_dashbaord_avg: async ({ set }) => {
    try {
      const [sellPrice, allPending, allStock, allMembers] = await Promise.all([
        prisma.tb_billorder.aggregate({
          where: {
            status_pm: "recevied",
          },
          _sum: {
            bill_price: true,
          },
        }),
        prisma.tb_billorder.count({
          where: {
            status_pm: "pending",
          },
        }),
        prisma.tb_product.aggregate({
          _sum: {
            pro_number: true,
          },
        }),
        prisma.tb_user.count({
          where: {
            roleId: 1,
          },
        }),
      ]);

      set.status = 200;
      return {
        sellPrice: sellPrice._sum.bill_price,
        allPending,
        allStock: allStock._sum.pro_number,
        allMembers,
      };
    } catch (error) {
      console.error(error);
      set.status = 500;
      return { success: false, error: error.message };
    }
  },
  dashboard_lastest_order: async ({ set }) => {
    try {
      const data = await prisma.tb_billorder.findMany({
        take: 10,
        select: {
          bill_id: true,
          status_pm: true,
          bill_productList: true,
          bill_productPeace: true,
          bill_price: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      set.status = 200;
      return data;
    } catch (error) {
      console.error(error);
      set.status = 500;
      return { success: false, error: error.message };
    }
  },
  dashbaord_product: async ({ set }) => {
    try {
      const data = await prisma.tb_product.findMany({
        take: 10,
        select: {
          pro_id: true,
          pro_name: true,
          pro_number: true,
          sell_count: true,
          imgs: {
            take: 1,
            select: {
              url: true,
            },
          },
        },
        orderBy: {
          sell_count: "desc",
        },
      });

      set.status = 200;
      return data;
    } catch (error) {
      console.error(error);
      set.status = 500;
      return { success: false, error: error.message };
    }
  },
  dashbaord_members: async ({ set }) => {
    try {
      const data = await prisma.tb_user.findMany({
        where: {
          roleId: {
            equals: 1,
          },
        },
        select: {
          user_id: true,
          title_type: true,
          first_name: true,
          last_name: true,
          profile: true,
          _count: {
            select: {
              bill_orders: true,
            },
          },
        },
        orderBy: {
          bill_orders: {
            _count: "desc",
          },
        },
      });

      set.status = 200;
      return data;
    } catch (error) {
      console.error(error);
      set.status = 500;
      return { success: false, error: error.message };
    }
  },
  sell_reports: async ({ set }) => {
    try {
      const orders = await prisma.tb_billorder.findMany({
        where: {
          status_pm: "recevied",
        },
        select: {
          bill_date: true,
          bill_price: true,
          pm_method: true,
          order_details: {
            select: { quantity: true },
          },
        },
      });

      // แปลงข้อมูลเป็นรายงานแบบ row
      const report = orders.map((o) => ({
        วันที่: o.bill_date.toISOString().split("T")[0], // แปลงเป็น yyyy-mm-dd
        จำนวนสินค้า: o.order_details.reduce((sum, d) => sum + d.quantity, 0),
        วิธีชำระเงิน: o.pm_method,
        ขายได้: o.bill_price,
      }));

      return report;
    } catch (error) {
      console.error(error);
      return (set.status = 500);
    }
  },
  get_members: async ({ set, query }) => {
    try {
      const { page, take, search, searchStatus, sort } = query;
      const skip = Number(take) * (page - 1);

      let filter = {};
      if (searchStatus === "true") {
        filter = {
          allowed: true,
        };
      } else if (searchStatus === "false") {
        filter = {
          allowed: false,
        };
      }
      if (search) {
        filter = {
          ...filter,
          OR: [
            {
              title_type: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              first_name: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              last_name: {
                contains: search,
                mode: "insensitive",
              },
            },
          ],
        };
      }

      const [members, total, sumAmout] = await Promise.all([
        prisma.tb_user.findMany({
          take: Number(take),
          skip,
          where: {
            ...filter,
            roleId: {
              lt: 2,
            },
          },
          select: {
            user_id: true,
            title_type: true,
            first_name: true,
            last_name: true,
            createdAt: true,
            allowed: true,
            _count: {
              select: {
                bill_orders: true,
              },
            },
          },
          orderBy: {
            ...JSON.parse(sort),
          },
        }),
        prisma.tb_user.count({
          where: {
            ...filter,
          },
        }),
        prisma.tb_billorder.groupBy({
          by: ["user_id"],
          _sum: {
            bill_price: true,
          },
        }),
      ]);

      set.status = 200;
      return {
        members: members.map((m) => {
          const match = sumAmout.find((s) => s.user_id === m.user_id);
          return {
            ...m,
            total: match && match._sum.bill_price,
          };
        }),
        total,
        totalPage: Math.ceil(total / take) < 1 ? 1 : Math.ceil(total / take),
      };
    } catch (error) {
      console.error(error);
      return (set.status = 500);
    }
  },
  create_members: async ({ set, body }) => {
    try {
      const { email, first_name, last_name, title_type, password } = body;
      if (!email || !first_name || !last_name || !title_type || !password) {
        return (set.status = 400);
      }
      const isExisting = await prisma.tb_user.findFirst({
        where: {
          OR: [
            {
              user_name: email,
            },
            {
              email: email,
            },
          ],
        },
        select: {
          user_id: true,
        },
      });
      if (isExisting) {
        return { err: "อีเมลนี้ถูกใช้งานแล้ว" };
      }

      const salt = await bcrytpjs.genSalt(12);
      const hash = await bcrytpjs.hash(password, salt);

      const newUser = await prisma.tb_user.create({
        data: {
          user_name: email,
          email,
          title_type,
          first_name,
          last_name,
          password: hash,
          ctn_status: "",
        },
      });
      if (!newUser) return (set.status = 400);

      const mailOptions = {
        from: "ecommerceezy@gmail.com", // ✅ ตรงนี้สะกดผิด ควรเป็น from ไม่ใช่ form
        to: email,
        subject: "รหัสผ่านสำหรับเข้าสู่ระบบ",
        html: `
    <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9fafb; color: #333;">
      <div style="max-width: 500px; margin: auto; background: #ffffff; border-radius: 10px; padding: 30px; box-shadow: 0 4px 8px rgba(0,0,0,0.05);">
        <h2 style="text-align: center; color: #2563eb;">E-Commerce Ezy</h2>
        <p>สวัสดีคุณ${first_name}</p>
        <p>นี่คือ <strong>รหัสผ่านสำหรับเข้าสู่ระบบ</strong> ของคุณ:</p>
        
        <div style="text-align: center; margin: 20px 0;">
          <span style="display: inline-block; font-size: 20px; font-weight: bold; color: #111; background: #f3f4f6; padding: 10px 20px; border-radius: 8px;">
            ${password}
          </span>
        </div>
        
        <p style="color: #555;">
          โปรดใช้รหัสผ่านนี้เพื่อเข้าสู่ระบบ และเพื่อความปลอดภัย 
          แนะนำให้คุณเปลี่ยนรหัสผ่านทันทีหลังจากเข้าสู่ระบบเรียบร้อยแล้ว
        </p>
        
        <p style="margin-top: 30px; text-align: center; color: #6b7280; font-size: 12px;">
          หากคุณไม่ได้ร้องขอรหัสผ่านนี้ โปรดติดต่อฝ่ายสนับสนุนของเรา
        </p>
      </div>
    </div>
  `,
      };
      await transporter.sendMail(mailOptions);

      set.status = 200;
      return { ok: true };
    } catch (error) {
      console.error(error);
      return (set.status = 500);
    }
  },
  members_avg: async ({ set }) => {
    try {
      const [allMembers, allAllowed, allUnAllowed] = await Promise.all([
        prisma.tb_user.count({
          where: {
            roleId: {
              lt: 2,
            },
          },
        }),
        prisma.tb_user.count({
          where: {
            allowed: true,
            roleId: {
              lt: 2,
            },
          },
        }),
        prisma.tb_user.count({
          where: {
            allowed: false,
            roleId: {
              lt: 2,
            },
          },
        }),
      ]);

      set.status = 200;
      return {
        allAllowed,
        allMembers,
        allUnAllowed,
      };
    } catch (error) {
      console.error(error);
      return (set.status = 500);
    }
  },
  toggle_member: async ({ set, body }) => {
    try {
      const { id, isAllowed } = body;
      if (!id) return (set.status = 400);

      const update = await prisma.tb_user.update({
        where: {
          user_id: Number(id),
        },
        data: {
          allowed: !isAllowed,
        },
        select: {
          email: true,
        },
      });
      if (!update) return (set.status = 400);

      let subject = "";
      let html = ``;

      if (isAllowed) {
        // 👉 บัญชีถูกระงับ
        subject = "บัญชีของคุณถูกระงับการใช้งาน";
        html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; background: #f9fafb;">
      <div style="max-width: 500px; margin: auto; background: #fff; border-radius: 10px; padding: 30px; box-shadow: 0 4px 8px rgba(0,0,0,0.05);">
        <h2 style="color: #dc2626; text-align: center;">บัญชีถูกระงับ</h2>
        <p>เรียนผู้ใช้งาน,</p>
        <p>บัญชีของคุณได้ถูก <strong style="color:#dc2626;">ระงับการใช้งานชั่วคราว</strong> 
        เนื่องจากไม่เป็นไปตามข้อกำหนดของระบบ</p>
        <p>หากคิดว่าเป็นความผิดพลาด กรุณาติดต่อฝ่ายสนับสนุนเพื่อขอความช่วยเหลือ</p>
        <p style="margin-top:20px; font-size:12px; color:#6b7280;">ขอบคุณที่ใช้บริการของเรา</p>
      </div>
    </div>
  `;
      } else {
        // 👉 บัญชีใช้งานได้
        subject = "บัญชีของคุณพร้อมใช้งานแล้ว";
        html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; background: #f9fafb;">
      <div style="max-width: 500px; margin: auto; background: #fff; border-radius: 10px; padding: 30px; box-shadow: 0 4px 8px rgba(0,0,0,0.05);">
        <h2 style="color: #16a34a; text-align: center;">บัญชีพร้อมใช้งาน</h2>
        <p>สวัสดีคุณ,</p>
        <p>บัญชีของคุณได้ถูกเปิดใช้งานเรียบร้อยแล้ว 🎉</p>
        <p>คุณสามารถเข้าสู่ระบบและเริ่มใช้งานได้ทันที</p>
        <p style="margin-top:20px; font-size:12px; color:#6b7280;">ขอบคุณที่ใช้บริการของเรา</p>
      </div>
    </div>
  `;
      }

      const mailOptions = {
        from: "ecommerceezy@gmail.com",
        to: update.email,
        subject,
        html,
      };
      await transporter.sendMail(mailOptions);

      set.status = 200;
      return { ok: true };
    } catch (error) {
      console.error(error);
      return (set.status = 500);
    }
  },
  add_banner: async ({ set, body }) => {
    try {
      const { image, status } = body;
      if (!image) return (set.status = 400);

      const imgName = `${Date.now()}_${image?.name?.replace(/\s+/g, "")}`;
      await Bun.write(`./public/upload/${imgName}`, image);
      const newBanner = await prisma.banners.create({
        data: {
          img: imgName,
          status: `${status}`,
        },
      });
      if (!newBanner) return (set.status = 400);

      set.status = 200;
      return { ok: true };
    } catch (error) {
      console.error(error);
      return (set.status = 500);
    }
  },
  edit_banner: async ({ set, body, params }) => {
    try {
      const { bannerid: id } = params;
      const { image, status, changeImage } = body;
      if (!id) return (set.status = 400);
      const banner = await prisma.banners.findUnique({
        where: { id: Number(id) },
        select: {
          img: true,
        },
      });
      if (!banner) return (set.status = 404);
      let imgName = banner.img;

      if (changeImage) {
        // ลบรูปเดิม
        const imgPath = path.join(
          import.meta.dir,
          "../../public/upload",
          imgName
        );
        if (existsSync(imgPath)) {
          try {
            await unlink(imgPath);
            console.log("Successfully deleted:", imgPath);
          } catch (error) {
            console.error("Error deleting file:", error);
          }
        }
      }
      if (image && image !== "null") {
        // อัปโหลดรูปใหม่
        imgName = `${Date.now()}_${image?.name?.replace(/\s+/g, "")}`;
        await Bun.write(`./public/upload/${imgName}`, image);
      }

      const update = await prisma.banners.update({
        where: { id: Number(id) },
        data: {
          img: imgName,
          status: `${status}`,
        },
      });
      if (!update) return (set.status = 400);
      set.status = 200;
      return { ok: true };
    } catch (error) {
      console.error(error);
      return (set.status = 500);
    }
  },
  delete_banner: async ({ set, params }) => {
    try {
      const { bannerid: id } = params;
      if (!id) return (set.status = 400);
      const banner = await prisma.banners.findUnique({
        where: { id: Number(id) },
        select: {
          img: true,
        },
      });
      if (!banner) return (set.status = 404);
      const imgPath = path.join(
        import.meta.dir,
        "../../public/upload",
        banner.img
      );
      if (existsSync(imgPath)) {
        try {
          await unlink(imgPath);
          console.log("Successfully deleted:", imgPath);
        } catch (error) {
          console.error("Error deleting file:", error);
        }
      }
      const del = await prisma.banners.delete({
        where: { id: Number(id) },
      });
      if (!del) return (set.status = 400);
      set.status = 200;
      return { ok: true };
    } catch (error) {
      console.error(error);
      return (set.status = 500);
    }
  },
  update_slip_return: async ({ set, body, params }) => {
    try {
      const { orderid } = params;
      const { slip_return } = body;
      if (!orderid) return (set.status = 400);

      let oldSlip = await prisma.tb_billorder.findUnique({
        where: {
          bill_id: orderid,
        },
        select: {
          slip_return: true,
          status_pm: true,
          user: {
            select: {
              email: true,
            },
          },
        },
      });
      if (!oldSlip) return (set.status = 404);
      if (oldSlip.slip_return && slip_return !== "null") {
        // ลบรูปเดิม
        const imgPath = path.join(
          import.meta.dir,
          "../../public/upload",
          oldSlip.slip_return
        );
        if (existsSync(imgPath)) {
          try {
            await unlink(imgPath);
            console.log("Successfully deleted:", imgPath);
          } catch (error) {
            console.error("Error deleting file:", error);
          }
        }
      }

      let imgName = oldSlip.slip_return;
      if (slip_return && slip_return !== "null") {
        // อัปโหลดรูปใหม่
        imgName = `${Date.now()}_${slip_return?.name?.replace(/\s+/g, "")}`;
        await Bun.write(`./public/upload/${imgName}`, slip_return);
      }

      // ส่งอีเมล
      if (oldSlip.status_pm === "return_pending") {
        const mailOptions = {
          from: "ร้านค้าได้คืนเงินให้คุณแล้ว!", // เปลี่ยนเป็นอีเมลของคุณ
          to: oldSlip.user.email, // ใส่อีเมลลูกค้า
          subject: `หลักฐานการคืนเงินถูกอัปโหลดแล้ว | คำสั่งซื้อ #${orderid}`,
          html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6;">
        <h2 style="color: #2E86C1;">📢 แจ้งเตือนการคืนเงิน</h2>
        <p>เรียนคุณลูกค้า,</p>
        <p>หลักฐานการคืนเงินสำหรับคำสั่งซื้อ <strong>#${orderid}</strong> ได้ถูกอัปโหลดเรียบร้อยแล้ว</p>
        <p>โปรดเข้าระบบเพื่อตรวจสอบรายละเอียดการคืนเงินของคุณ</p>
       
        <p style="margin-top: 20px;">หากคุณไม่ได้ร้องขอการคืนเงินนี้ กรุณาติดต่อฝ่ายสนับสนุนทันที</p>
        <hr>
        <p style="font-size: 12px; color: #777;">ขอขอบคุณที่ใช้บริการของเรา</p>
      </div>
    `,
        };

        await transporter.sendMail(mailOptions);
      }

      const update = await prisma.tb_billorder.update({
        where: {
          bill_id: orderid,
        },
        data: {
          slip_return: imgName,
          status_pm: "return_sending",
        },
      });
      if (!update) return (set.status = 400);
      set.status = 200;
      return { ok: true };
    } catch (error) {
      console.error(error);
      return (set.status = 500);
    }
  },
  product_promotion_options: async ({ set }) => {
    try {
      const data = await prisma.tb_product.findMany({
        where: {
          promotion: {
            is: null,
          },
        },
        select: {
          pro_id: true,
          pro_name: true,
        },
      });

      set.status === 200;
      return data.map((d) => ({ label: d?.pro_name, value: d?.pro_id }));
    } catch (error) {
      console.error(error);
      return (set.status = 500);
    }
  },
  new_promotion: async ({ body, set }) => {
    try {
      const {
        name,
        description,
        discount,
        startDate,
        endDate,
        selectProductId,
      } = body;

      if (
        !name ||
        !discount ||
        !startDate ||
        !endDate ||
        !selectProductId ||
        selectProductId.length === 0
      ) {
        set.status = 400;
        return { err: "ข้อมูลไม่ครบถ้วน" };
      }

      const nameExist = await prisma.tb_promotion.findUnique({
        where: { name },
        select: { id: true },
      });

      if (nameExist) {
        set.status = 400;
        return { err: "พบว่ามีโปรโมชันชื่อนี้ในระบบแล้ว" };
      }

      const result = await prisma.$transaction(async (tx) => {
        // Create promotion
        const newPromotion = await tx.tb_promotion.create({
          data: {
            name,
            discount,
            description,
            start_date: new Date(startDate),
            end_date: new Date(endDate),
          },
        });

        // Update products to link with this promotion
        const productIds = selectProductId.map((item) => item.value);

        await tx.tb_product.updateMany({
          where: {
            pro_id: { in: productIds },
          },
          data: {
            promotion_id: newPromotion.id,
          },
        });

        return newPromotion;
      });

      set.status = 200;
      return { success: true, data: result };
    } catch (error) {
      console.error(error);
      set.status = 500;
      return { err: "เกิดข้อผิดพลาดในการสร้างโปรโมชัน" };
    }
  },
  get_promotions: async ({ set, query }) => {
    try {
      const { page, search, sort, promotionStart, promotionEnd, take } = query;
      const skip = Number(take) * (page - 1);

      let filter = {};
      if (search) {
        filter = {
          AND: [
            {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              description: {
                contains: search,
                mode: "insensitive",
              },
            },
          ],
        };
      }
      if (promotionStart) {
        filter = {
          ...filter,
          start_date: promotionStart,
        };
      }
      if (promotionEnd) {
        filter = {
          ...filter,
          end_date: promotionEnd,
        };
      }

      const [data, total] = await Promise.all([
        prisma.tb_promotion.findMany({
          take: Number(take),
          skip,
          where: {
            ...filter,
          },
          select: {
            id: true,
            name: true,
            start_date: true,
            end_date: true,
            discount: true,
            description: true,
            _count: {
              select: {
                products: true,
              },
            },
          },
          orderBy: {
            ...JSON.parse(sort),
          },
        }),
        prisma.tb_promotion.count({
          where: {
            ...filter,
          },
        }),
      ]);

      set.status = 200;
      return {
        data,
        total,
        totalPage: Math.ceil(total / take) < 1 ? 1 : Math.ceil(total / take),
      };
    } catch (error) {
      console.error(error);
      return (set.status = 500);
    }
  },
  get_promotion_avg: async ({ set }) => {
    try {
      const [allPromotion, allProductInPromotion] = await Promise.all([
        prisma.tb_promotion.count(),
        prisma.tb_product.count({
          where: {
            promotion_id: {
              not: null,
            },
          },
        }),
      ]);

      set.status = 200;
      return { allPromotion, allProductInPromotion };
    } catch (error) {
      console.error(error);
      return (set.status = 500);
    }
  },
  delete_promotion: async ({ set, params }) => {
    try {
      const { promotionId } = params;
      if (!promotionId) return (set.status = 400);

      const del = await prisma.tb_promotion.delete({
        where: {
          id: Number(promotionId),
        },
      });
      if (!del) return (set.status = 400);

      set.status = 200;
      return { ok: true };
    } catch (error) {
      console.error(error);
      return (set.status = 500);
    }
  },
  get_promotion_id: async ({ set, params }) => {
    try {
      const { promotionId } = params;
      if (!promotionId) return (set.status = 400);

      const promotion = await prisma.tb_promotion.findUnique({
        where: {
          id: Number(promotionId),
        },
        select: {
          id: true,
          name: true,
          description: true,
          start_date: true,
          end_date: true,
          discount: true,
          products: {
            select: {
              pro_id: true,
              pro_name: true,
              pro_price: true,
              imgs: {
                take: 1,
                select: {
                  url: true,
                },
              },
            },
          },
        },
      });

      set.status = 200;
      return promotion;
    } catch (error) {
      console.error(error);
      return (set.status = 500);
    }
  },
  update_promotion: async ({ set, body, params }) => {
    try {
      const { promotionId } = params;
      if (!promotionId) {
        set.status = 400;
        return { err: "ไม่พบ ID โปรโมชัน" };
      }

      const {
        name,
        description,
        discount,
        startDate,
        endDate,
        selectProductId,
      } = body;
      console.log("🚀 ~ body:", body);

      if (
        !name ||
        !discount ||
        !startDate ||
        !endDate ||
        !selectProductId ||
        selectProductId.length === 0
      ) {
        set.status = 400;
        return { err: "ข้อมูลไม่ครบถ้วน" };
      }

      // Check if promotion exists
      const promotionExist = await prisma.tb_promotion.findUnique({
        where: { id: Number(promotionId) },
      });

      if (!promotionExist) {
        set.status = 404;
        return { err: "ไม่พบโปรโมชันนี้ในระบบ" };
      }

      // Check if name is taken by another promotion
      const nameExist = await prisma.tb_promotion.findUnique({
        where: { name },
        select: { id: true },
      });

      if (nameExist && nameExist.id === promotionId) {
        set.status = 400;
        return { err: "พบว่ามีโปรโมชันชื่อนี้ในระบบแล้ว" };
      }

      const result = await prisma.$transaction(async (tx) => {
        // Update promotion
        const updatedPromotion = await tx.tb_promotion.update({
          where: { id: Number(promotionId) },
          data: {
            name,
            discount,
            description,
            start_date: new Date(startDate),
            end_date: new Date(endDate),
          },
        });

        // Remove promotion from all products that had this promotion
        await tx.tb_product.updateMany({
          where: { promotion_id: Number(promotionId) },
          data: { promotion_id: null },
        });

        // Add promotion to selected products
        const productIds = selectProductId.map((item) => item.value);
        await tx.tb_product.updateMany({
          where: {
            pro_id: { in: productIds },
          },
          data: {
            promotion_id: Number(promotionId),
          },
        });

        return updatedPromotion;
      });

      set.status = 200;
      return { success: true, data: result };
    } catch (error) {
      console.error(error);
      set.status = 500;
      return { err: "เกิดข้อผิดพลาดในการอัปเดตโปรโมชัน" };
    }
  },
};
