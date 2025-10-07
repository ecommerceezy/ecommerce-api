import { PrismaClient } from "../src/generated/prisma";
import { unlink } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import bcryptjs from "bcryptjs";
import QRCode from "qrcode";
import generatePayload from "promptpay-qr";
import { v4 as uuid } from "uuid";
import { transporter } from "../config/config";

const prisma = new PrismaClient();

export const userController = {
  getInfo: async ({ set, store }) => {
    try {
      const { id } = store.user;
      if (!id) return (set.status = 400);

      const data = await prisma.tb_user.findUnique({
        where: {
          user_id: Number(id),
        },
        select: {
          title_type: true,
          first_name: true,
          last_name: true,
          gender: true,
          email: true,
          tel: true,
          birth_date: true,
          profile: true,
        },
      });

      set.status = 200;
      return data;
    } catch (error) {
      console.error(error);
      set.status = 500;
    }
  },
  updateProfile: async ({ body, set, store }) => {
    try {
      const { id } = store.user;
      const { profile: file, birth_date, changeprofile, ...rest } = body;
      if (!id) return (set.status = 400);

      const oldProfile = await prisma.tb_user.findUnique({
        where: {
          user_id: Number(id),
        },
        select: {
          profile: true,
        },
      });

      // delete old image
      if (changeprofile && oldProfile?.profile) {
        const delPath = path.join(
          import.meta.dir,
          "../public/upload",
          oldProfile.profile
        );
        if (existsSync(delPath)) {
          await unlink(delPath);
        }
      }

      // save new image
      let imgName = oldProfile.profile;
      if (file) {
        imgName = `${Date.now()}_${file.name?.replace(/\s+/g, "")}`;
        await Bun.write(`./public/upload/${imgName}`, file);
      }

      // update info
      const updated = await prisma.tb_user.update({
        where: {
          user_id: Number(id),
        },
        data: {
          profile: imgName,
          birth_date: birth_date === "//" ? null : birth_date,
          ...rest,
        },
      });
      if (!updated) return (set.status = 400);

      set.status = 200;
      return { ok: true };
    } catch (error) {
      console.error(error);
      set.status = 500;
    }
  },
  addAddress: async ({ body, set, store }) => {
    try {
      const { id } = store.user;
      if (!id) return (set.status = 400);

      const userAddress = await prisma.tb_user_address.count({
        where: {
          user_id: Number(id),
        },
      });
      if (userAddress >= 3) {
        set.status = 400;
        return { err: "คุณสามารถเพิ่มที่อยู่ได้สูงสุด 3 ที่อยู่เท่านั้น" };
      }

      const {
        address,
        province,
        amphure: district,
        tambon: sub_district,
        zipcode,
        is_using,
        phone,
      } = body;
      if (
        !address ||
        !province ||
        !district ||
        !sub_district ||
        !zipcode ||
        !phone
      )
        return (set.status = 400);

      if (is_using) {
        const usedsAddress = await prisma.tb_user_address.count({
          where: {
            user_id: Number(user_id),
            is_using: true,
            NOT: {
              id: Number(id),
            },
          },
        });
        // ปิดการใช้งานที่อยู่ที่ถูกใช้งานอยู่
        if (usedsAddress > 0) {
          await prisma.tb_user_address.updateMany({
            where: {
              user_id: Number(user_id),
              is_using: true,
              NOT: {
                id: Number(id),
              },
            },
            data: {
              is_using: false,
            },
          });
        }
      }

      const newAddress = await prisma.tb_user_address.create({
        data: {
          user_id: Number(id),
          address,
          province,
          district,
          sub_district,
          zipcode: `${zipcode}`,
          is_using,
          phone,
        },
      });
      if (!newAddress) return (set.status = 400);

      set.status = 200;
      return { ok: true };
    } catch (error) {
      console.error(error);
      set.status = 500;
    }
  },
  updateAddress: async ({ body, set, params, store }) => {
    try {
      const { id: user_id } = store.user;
      const { id } = params;
      if (!user_id || !id) return (set.status = 400);
      const {
        address,
        province,
        amphure: district,
        tambon: sub_district,
        zipcode,
        is_using,
        phone,
      } = body;
      if (
        !address ||
        !province ||
        !district ||
        !sub_district ||
        !zipcode ||
        !phone
      )
        return (set.status = 400);

      if (is_using) {
        const usedsAddress = await prisma.tb_user_address.count({
          where: {
            user_id: Number(user_id),
            is_using: true,
            NOT: {
              id: Number(id),
            },
          },
        });
        // ปิดการใช้งานที่อยู่ที่ถูกใช้งานอยู่
        if (usedsAddress > 0) {
          await prisma.tb_user_address.updateMany({
            where: {
              user_id: Number(user_id),
              is_using: true,
              NOT: {
                id: Number(id),
              },
            },
            data: {
              is_using: false,
            },
          });
        }
      }

      const updateAddress = await prisma.tb_user_address.updateMany({
        where: {
          id: Number(id),
          user_id: Number(user_id),
        },
        data: {
          address,
          province,
          district,
          phone,
          sub_district,
          zipcode: `${zipcode}`,
          is_using,
        },
      });
      if (!updateAddress) return (set.status = 400);
      set.status = 200;
      return { ok: true };
    } catch (error) {
      console.error(error);
      set.status = 500;
    }
  },
  getAddress: async ({ store, set }) => {
    try {
      const { id } = store.user;
      if (!id) return (set.status = 400);

      const address = await prisma.tb_user_address.findMany({
        where: {
          user_id: Number(id),
        },
        select: {
          address: true,
          district: true,
          province: true,
          zipcode: true,
          id: true,
          is_using: true,
          sub_district: true,
          phone: true,
        },
        orderBy: {
          id: "desc",
        },
      });

      set.status = 200;
      return address;
    } catch (error) {
      console.error(error);
      set.status = 500;
    }
  },
  get_address_by_id: async ({ set, params }) => {
    const { id } = params;
    try {
      if (!id) return (set.status = 400);
      const address = await prisma.tb_user_address.findUnique({
        where: {
          id: Number(id),
        },
        select: {
          address: true,
          district: true,
          province: true,
          zipcode: true,
          id: true,
          is_using: true,
          sub_district: true,
          phone: true,
        },
      });
      set.status = 200;
      return address;
    } catch (error) {
      console.error(error);
      set.status = 500;
    }
  },
  change_password: async ({ body, set, store }) => {
    try {
      const { id } = store.user;
      if (!id) return (set.status = 400);

      const { current_pass, new_pass } = body;
      if (!current_pass || !new_pass) return (set.status = 400);

      const user = await prisma.tb_user.findUnique({
        where: {
          user_id: Number(id),
        },
        select: {
          password: true,
        },
      });

      if (!user) return (set.status = 400);

      const isMath = await bcryptjs.compare(current_pass, user.password);
      if (!isMath) return { err: "รหัสผ่านปัจจุบันไม่ถูกต้อง!" };

      const isSame = await bcryptjs.compare(new_pass, user.password);
      if (isSame) return { err: "ไม่สามารถเปลี่ยนรหัสผ่านได้" };

      // newpass
      const salt = await bcryptjs.genSalt(12);
      const hash = await bcryptjs.hash(new_pass, salt);

      // save new pass
      const update = await prisma.tb_user.update({
        where: {
          user_id: Number(id),
        },
        data: {
          password: hash,
        },
      });
      if (!update) return (set.status = 400);

      set.headers[
        "Set-Cookie"
      ] = `token=; HttpOnly; Secure; Path=/; SameSite=Strict; Max-Age=86400`;

      set.status = 200;
      return { ok: true };
    } catch (error) {
      console.error(error);
      set.status = 500;
    }
  },
  get_checkout_data: async ({ set, store }) => {
    try {
      const { id } = store.user;
      if (!id) return (set.status = 400);

      const data = await prisma.tb_user.findUnique({
        where: {
          user_id: Number(id),
        },
        select: {
          title_type: true,
          first_name: true,
          last_name: true,
          address: true,
          email: true,
          tb_user_address: {
            take: 1,
            where: {
              is_using: true,
            },
            select: {
              province: true,
              district: true,
              sub_district: true,
              zipcode: true,
              address: true,
              phone: true,
            },
          },
        },
      });

      set.status = 200;
      return data;
    } catch (error) {
      console.error(error);
      set.status = 500;
    }
  },
  qrcode_promptpay: async ({ set, params }) => {
    try {
      const { amount } = params;
      const phone = "0965850195";

      if (!amount) {
        set.status = 400;
        return { error: "กรุณาระบุ amount" };
      }

      // gen payload ตามมาตรฐาน PromptPay QR
      const payload = generatePayload(phone, { amount: Number(amount) });

      // สร้าง QR Code base64
      const qr = await QRCode.toDataURL(payload);
      set.status = 200;
      return qr;
    } catch (error) {
      console.error(error);
      set.status = 200;
    }
  },
  create_order: async ({ body, set }) => {
    try {
      const {
        "cart-product": cart_product,
        "payment-method": payment_method,
        totalPeace,
        totalProductPrice,
        totalFreight,
        totalPay,
        user_id,
        slip,
        totalProductList,
        totalDiscount,
      } = body;
      if (
        (!cart_product ||
          !payment_method ||
          !totalPeace ||
          !totalProductPrice ||
          !totalFreight ||
          !totalPay ||
          !user_id ||
          !totalProductList,
        payment_method === "QR Promptpat" && !slip)
      ) {
        return (set.status = 400);
      }

      // upload slip
      let slipUrl = "";
      if (payment_method === "QR Promptpay") {
        const file = slip; // รับมาจาก body หรือ form-data
        const imgName = `${Date.now()}_${file.name?.replace(/\s+/g, "")}`;
        slipUrl = imgName;
        await Bun.write(`./public/upload/${imgName}`, file);
      }

      const result = await prisma.$transaction(async (tx) => {
        // 1) สร้าง billorder
        const billorder = await tx.tb_billorder.create({
          data: {
            bill_id: `${uuid()}-${Date.now()}`,
            bill_date: new Date(),
            bill_pm: payment_method === "QR Promptpay" ? new Date() : null,
            bill_freighttotal: Number(totalFreight),
            bill_totalamount: Number(totalProductPrice),
            bill_price: Number(totalPay),
            bill_productList: Number(totalProductList),
            bill_productPeace: Number(totalPeace),
            bill_totalDiscount: Number(totalDiscount),
            status_pm: "pending",
            pm_method: payment_method,
            slip_pm: slipUrl,
            user_id: Number(user_id),
          },
        });

        // 2) วน loop cart_product แล้วสร้าง tb_orderdetails
        for (const item of JSON.parse(cart_product)) {
          await tx.tb_orderdetails.create({
            data: {
              bill_id: billorder.bill_id,
              pro_id: Number(item.pro_id),
              quantity: Number(item.count),
              unit: "ชิ้น", // หรือรับจาก frontend
              total_amount: Number(item.pro_price) * Number(item.count),
              status: "pending", // default,
              color: item.color,
              size: item?.size,
            },
          });
        }

        return billorder;
      });

      const mailUser = await prisma.tb_user.findUnique({
        where: {
          user_id: Number(user_id),
        },
        select: {
          email: true,
          title_type: true,
          first_name: true,
          last_name: true,
          tel: true,
          tb_user_address: {
            take: 1,
            where: {
              is_using: true,
            },
            select: {
              province: true,
              district: true,
              sub_district: true,
              zipcode: true,
              address: true,
              phone: true,
            },
          },
        },
      });
      // ส่งอีเมลถึงร้าน
      const mailOptions = {
        from: mailUser,
        to: "ecommerceezy@gmail.com",
        subject: "มีคำสั่งซื้อใหม่!",
        text: "คุณมีคำสั่งซื้อใหม่ โปรดตรวจสอบในระบบ",
        html: `
  <div style="font-family: Arial, sans-serif; line-height:1.6; color:#333;">
    <h2 style="color:#2c3e50;">📦 มีคำสั่งซื้อใหม่!</h2>
    <p>แจ้งเตือน!,</p>
    <p>คุณได้รับคำสั่งซื้อใหม่จากลูกค้า กรุณาตรวจสอบรายละเอียดในระบบจัดการคำสั่งซื้อ</p>

    <div style="margin:20px 0; padding:15px; background:#f8f9fa; border:1px solid #ddd; border-radius:5px;">
      <h3 style="margin-top:0; color:#2c3e50;">🧾 รายละเอียดคำสั่งซื้อ</h3>
      <p><strong>ชื่อลูกค้า:</strong> ${mailUser.title_type}${
          mailUser.first_name
        } ${mailUser.last_name}</p>
      <p><strong>ที่อยู่จัดส่ง:</strong>${
        mailUser?.tb_user_address[0]?.address || "ไม่มีที่อยู่"
      } ${mailUser?.tb_user_address[0]?.sub_district || ""} ${
          mailUser?.tb_user_address[0]?.district || ""
        } จ.${mailUser?.tb_user_address[0]?.province || ""} ${
          mailUser?.tb_user_address[0]?.zipcode || ""
        }\nเบอร์โทรศัพท์ : ${mailUser?.tb_user_address[0]?.phone}</p>
      <p><strong>เบอร์โทร:</strong> ${mailUser?.tel}</p>
      <p><strong>วิธีการชำระเงิน:</strong> ${payment_method}</p>
      
    <h2 style="margin-top:10px">สินค้าทั้งหมด ${totalProductList} รายการ จำนวน ${totalPeace} ชิ้น ราคารวม ${Number(
          totalPay
        ).toLocaleString()} บาท</h2>
    </div>
  </div>
  `,
      };

      await transporter.sendMail(mailOptions);

      set.status = 200;
      return { success: true, result };
    } catch (error) {
      console.error(error);
      set.status = 500;
      return { success: false, error: error.message };
    }
  },
  get_order_history: async ({ store, set, query }) => {
    try {
      const { id } = store.user;
      if (!id) return (set.status = 400);

      const { status, sort, search } = query;
      let filter = {};

      if (search) {
        filter = {
          ...filter,
          OR: [
            {
              bill_id: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              order_details: {
                some: {
                  OR: [
                    {
                      product: {
                        pro_name: {
                          contains: search,
                          mode: "insensitive",
                        },
                      },
                    },
                  ],
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

      const data = await prisma.tb_billorder.findMany({
        where: {
          user_id: Number(id),
          ...filter,
        },
        select: {
          bill_id: true,
          bill_productList: true,
          bill_productPeace: true,
          bill_totalDiscount: true,
          bill_date: true,
          status_pm: true,
          order_details: {
            take: 1,
            select: {
              product: {
                select: {
                  imgs: {
                    take: 1,
                    select: {
                      url: true,
                    },
                  },
                  pro_name: true,
                  promotion: {
                    select: {
                      discount: true,
                    },
                  },
                  categories: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
              color: true,
              size: true,
              quantity: true,
              total_amount: true,
            },
          },
          bill_totalamount: true,
          pm_method: true,
        },
        orderBy: {
          ...JSON.parse(sort),
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
  get_order_id: async ({ set, params }) => {
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
                  pro_price: true,
                  promotion: {
                    select: {
                      discount: true,
                    },
                  },
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
  update_slip: async ({ set, body, params }) => {
    try {
      const { orderid } = params;
      if (!orderid) return (set.status = 400);

      const { newslip } = body;

      const oldImage = await prisma.tb_billorder.findUnique({
        where: {
          bill_id: orderid,
        },
        select: {
          slip_pm: true,
        },
      });

      // ลบรูปเดิม
      const delPath = path.join(
        import.meta.dir,
        "../public/upload",
        oldImage.slip_pm
      );
      if (existsSync(delPath)) {
        await unlink(delPath);
      }

      // บันทึกรูปใหม่
      const imgName = `${Date.now()}_${newslip.name?.replace(/\s+/g, "")}`;
      await Bun.write(`./public/upload/${imgName}`, newslip);

      // update db
      const update = await prisma.tb_billorder.update({
        where: {
          bill_id: orderid,
        },
        data: {
          slip_pm: imgName,
        },
      });
      if (!update) return (set.status = 400);

      set.status = 200;
      return { ok: true };
    } catch (error) {
      console.error(error);
      set.status = 500;
      return { success: false, error: error.message };
    }
  },
  update_order_status: async ({ set, body, store }) => {
    try {
      const { status, orderId } = body;
      // console.log("🚀 ~ body:", body);
      if (!status || !orderId) return (set.status = 400);

      let update;

      if (status === "cancel") {
        update = await prisma.tb_billorder.update({
          where: { bill_id: orderId },
          data: { status_pm: status },
        });
      } else if (status === "recevied") {
        try {
          update = await prisma.$transaction(async (tx) => {
            // 1. ดึง order details ของบิลนี้
            const orderDetails = await tx.tb_orderdetails.findMany({
              where: { bill_id: orderId },
              select: { pro_id: true, quantity: true },
            });

            // 2. วนลูปลด stock ของแต่ละสินค้า
            for (const detail of orderDetails) {
              await tx.tb_product.update({
                where: { pro_id: detail.pro_id },
                data: {
                  pro_number: {
                    decrement: detail.quantity, // ตัด stock
                  },
                  sell_count: {
                    increment: detail.quantity, // บวกยอดขาย
                  },
                },
              });
            }

            const thisBillPmMethod = await tx.tb_billorder.findUnique({
              where: {
                bill_id: orderId,
              },
              select: {
                pm_method: true,
                bill_pm: true,
              },
            });
            // 3. อัพเดตสถานะบิล
            return tx.tb_billorder.update({
              where: { bill_id: orderId },
              data: {
                status_pm: "recevied",
                bill_pm:
                  thisBillPmMethod.pm_method === "เก็บปลายทาง"
                    ? new Date()
                    : thisBillPmMethod.bill_pm,
              },
            });
          });
        } catch (error) {
          console.error(error);
          set.status = 500;
        }
        // ใช้ transaction เพื่อให้แน่ใจว่าทุกอย่างทำเสร็จครบ
      } else {
        update = await prisma.tb_billorder.update({
          where: { bill_id: orderId },
          data: { status_pm: status },
        });
      }
      // if (!update) return (set.status = 400);

      const customerMail = await prisma.tb_user.findUnique({
        where: {
          user_id: Number(store.user.id),
        },
        select: {
          email: true,
        },
      });

      let html = ``;
      let subject = ``;
      let text = ``;

      if (status === "cancel") {
        // แจ้งเตือนร้านเมื่อลูกค้ายกเลิกสินค้า
        subject = "❌ คำสั่งซื้อถูกยกเลิก";
        text = "ลูกค้าได้ทำการยกเลิกคำสั่งซื้อ โปรดตรวจสอบในระบบ";
        html = `
    <div style="font-family: Arial, sans-serif; line-height:1.6; color:#333;">
      <h2 style="color:#e74c3c;">❌ คำสั่งซื้อถูกยกเลิก</h2>

      <p>ลูกค้าได้ทำการ <strong style="color:#e74c3c;">ยกเลิกคำสั่งซื้อ รหัสคำสั่งซื้อ ${orderId}</strong> แล้ว กรุณาตรวจสอบในระบบเพื่อยืนยันการเปลี่ยนแปลง</p>

      <hr style="margin:20px 0; border:none; border-top:1px solid #ddd;">
      <p style="font-size:12px; color:#888;">อีเมลนี้เป็นการแจ้งเตือนอัตโนมัติ กรุณาอย่าตอบกลับ</p>
    </div>
  `;
      } else if (status === "recevied") {
        // แจ้งเตือนร้านเมื่อลูกค้ารับสินค้าแล้ว
        subject = "✅ ลูกค้ารับสินค้าแล้ว";
        text = "ลูกค้าได้ยืนยันการรับสินค้าแล้ว โปรดตรวจสอบคำสั่งซื้อ";
        html = `
    <div style="font-family: Arial, sans-serif; line-height:1.6; color:#333;">
      <h2 style="color:#27ae60;">✅ ลูกค้ารับสินค้าแล้ว</h2>

      <p>ลูกค้าได้ <strong style="color:#27ae60;">ยืนยันการรับสินค้า</strong> เรียบร้อยแล้ว</p>
        <p>รหัสคำสั่งซื้อ : ${orderId}</p>
      </p>
      <hr style="margin:20px 0; border:none; border-top:1px solid #ddd;">
      <p style="font-size:12px; color:#888;">อีเมลนี้เป็นการแจ้งเตือนอัตโนมัติ กรุณาอย่าตอบกลับ</p>
    </div>
  `;
      } else if (status === "return_pending") {
        // แจ้งเตือนร้านเมื่อลูกค้าส่งคำขอคืนเงิน
        subject = "🔄 มีคำขอคืนเงินจากลูกค้า";
        text = "ลูกค้าได้ส่งคำขอคืนเงิน โปรดตรวจสอบในระบบ";
        html = `
    <div style="font-family: Arial, sans-serif; line-height:1.6; color:#333; background-color:#f9f9f9; padding:20px; border-radius:8px;">
      <div style="max-width:600px; margin:auto; background:#fff; padding:25px; border-radius:8px; box-shadow:0 2px 6px rgba(0,0,0,0.1);">
        <h2 style="color:#f39c12; margin-bottom:10px;">🔄 คำขอคืนเงินจากลูกค้า</h2>
        <p style="font-size:15px; margin-bottom:15px;">
          ลูกค้าได้ทำการส่งคำขอ <strong style="color:#f39c12;">คืนเงิน</strong> สำหรับคำสั่งซื้อหมายเลข 
          <strong style="color:#333;">${orderId}</strong>
        </p>
        <p style="font-size:14px; color:#555;">
          กรุณาเข้าสู่ระบบเพื่อทำการตรวจสอบสถานะคำสั่งซื้อ และดำเนินการตามขั้นตอนการคืนเงินให้ถูกต้อง
        </p>

        <hr style="margin:20px 0; border:none; border-top:1px solid #eee;">
        <p style="font-size:12px; color:#888; text-align:center;">
          อีเมลนี้เป็นการแจ้งเตือนอัตโนมัติ กรุณาอย่าตอบกลับ
        </p>
      </div>
    </div>
  `;
      } else if (status === "return_confirmed") {
        // แจ้งเตือนร้านค้าว่าลูกค้าได้รับเงินคืนเรียบร้อยแล้ว
        subject = "✅ ลูกค้าได้รับเงินคืนเรียบร้อยแล้ว";
        text = `สำหรับคำสั่งซื้อหมายเลข ${orderId} แล้ว`;
        html = `
  <div style="font-family: Arial, sans-serif; line-height:1.6; color:#333; background-color:#f9f9f9; padding:20px; border-radius:8px;">
    <div style="max-width:600px; margin:auto; background:#fff; padding:25px; border-radius:8px; box-shadow:0 2px 6px rgba(0,0,0,0.1);">
      <h2 style="color:#27ae60; margin-bottom:10px;">✅ การคืนเงินเสร็จสิ้น</h2>
      <p style="font-size:15px; margin-bottom:15px;">
        ระบบได้ดำเนินการคืนเงินให้กับลูกค้าสำหรับคำสั่งซื้อหมายเลข 
        <strong style="color:#333;">${orderId}</strong> 
        <strong style="color:#27ae60;">เรียบร้อยแล้ว</strong>
      </p>
      <p style="font-size:14px; color:#555;">
        โปรดตรวจสอบรายละเอียดการทำรายการในระบบหลังร้านของคุณ 
        เพื่อยืนยันความถูกต้องและเก็บบันทึกธุรกรรมตามขั้นตอน
      </p>
      <hr style="margin:20px 0; border:none; border-top:1px solid #eee;">
      <p style="font-size:12px; color:#888; text-align:center;">
        อีเมลนี้เป็นการแจ้งเตือนอัตโนมัติ กรุณาอย่าตอบกลับ
      </p>
    </div>
  </div>
  `;
      }

      const mailOptions = {
        form: customerMail.email,
        to: "ecommerceezy@gmail.com",
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
  get_bank: async ({ set, store }) => {
    try {
      const { id } = store.user;
      if (!id) return (set.status = 400);
      const data = await prisma.tb_user.findUnique({
        where: {
          user_id: Number(id),
        },
        select: {
          bank_name: true,
          bank_number: true,
          bank_owner: true,
        },
      });
      set.status = 200;
      return data;
    } catch (error) {
      console.error(error);
      set.status = 500;
    }
  },
  update_bank: async ({ body, set, store }) => {
    try {
      const { id } = store.user;
      if (!id) return (set.status = 400);
      const { bank_name, bank_number, bank_owner } = body;
      if (!bank_name || !bank_number || !bank_owner) return (set.status = 400);
      const update = await prisma.tb_user.update({
        where: {
          user_id: Number(id),
        },
        data: {
          bank_name,
          bank_number,
          bank_owner,
        },
      });
      if (!update) return (set.status = 400);
      set.status = 200;
      return { ok: true };
    } catch (error) {
      console.error(error);
      set.status = 500;
    }
  },
};
