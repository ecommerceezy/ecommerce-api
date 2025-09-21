import { transporter } from "../config/config";
import { PrismaClient } from "../src/generated/prisma";
import bcryptjs, { genSalt, hash } from "bcryptjs";
const prisma = new PrismaClient();

function generateOTP(length = 6) {
  return Math.floor(Math.random() * Math.pow(10, length))
    .toString()
    .padStart(length, "0");
}

export const authController = {
  createUser: async ({ body, set }) => {
    try {
      const { user_name, password, first_name, last_name, title_type } = body;

      // เช็กว่าใส่ค่าครบหรือไม่
      if (!user_name || !password || !first_name || !last_name || !title_type) {
        set.status = 400;
        return { error: "ข้อมูลไม่ครบถ้วน" };
      }

      // เช็กว่าผู้ใช้มีอยู่แล้วหรือยัง
      const isExist = await prisma.tb_user.findUnique({
        where: { user_name },
        select: { user_id: true },
      });

      if (isExist) {
        return { err: "ชื่อผู้ใช้งานหรืออีเมลนี้ถูกใช้งานแล้ว!" };
      }

      // เข้ารหัส password
      const salt = await bcryptjs.genSalt(12);
      const hash = await bcryptjs.hash(password, salt);

      const newUser = await prisma.tb_user.create({
        data: {
          user_name,
          password: hash,
          first_name,
          last_name,
          title_type,
          gender: title_type === "นาย" ? "ชาย" : "หญิง",
          ctn_status: "",
        },
      });

      if (!newUser) {
        set.status = 400;
        return { error: "ไม่สามารถสร้างผู้ใช้ได้" };
      }

      set.status = 201; // Created
      return { ok: true, user_id: newUser.user_id };
    } catch (error) {
      console.error(error);
      set.status = 500;
      return { error: "เกิดข้อผิดพลาดภายในระบบ" };
    }
  },
  checkLogin: async ({ set, store }) => {
    try {
      const { id, roleId } = store.user;
      if (!store.user) return (set.status = 400);
      let data = {};
      if (roleId < 2) {
        data = await prisma.tb_user.findUnique({
          where: {
            user_id: Number(id),
          },
          select: {
            user_id: true,
            first_name: true,
            roleId: true,
            profile: true,
          },
        });
      } else {
        data = {
          ...store.user,
        };
      }

      set.status = 200;
      return data;
    } catch (error) {
      console.error(error);
      set.status = 500;
      return { error: "เกิดข้อผิดพลาดภายในระบบ" };
    }
  },
  login: async ({ body, set, jwt }) => {
    try {
      const { user_name, password } = body;
      if (!user_name || !password) {
        return (set.status = 400);
      }

      const user = await prisma.tb_user.findUnique({
        where: {
          user_name,
        },
        select: {
          user_id: true,
          roleId: true,
          allowed: true,
          password: true,
        },
      });
      if (!user) {
        return { err: "ไม่พบผู้ใช้งาน" };
      }

      const isMatch = await bcryptjs.compare(password, user.password);
      if (!isMatch) {
        return { err: "รหัสผ่านไม่ถูกต้อง" };
      }

      if (!user.allowed) {
        return { err: "บัญชีของคุณถูกระงับชั่วคราว" };
      }

      const payload = {
        id: user.user_id,
        roleId: user.roleId,
        signDate: Date.now(),
      };

      const token = await jwt.sign(payload);
      set.headers[
        "Set-Cookie"
      ] = `token=${token}; HttpOnly; Secure; Path=/; SameSite=Strict; Max-Age=86400`;

      set.status = 200;
      return {
        roleId: user.roleId,
        ok: true,
      };
    } catch (error) {
      console.error(error);
      set.status = 500;
      return { error: "เกิดข้อผิดพลาดภายในระบบ" };
    }
  },
  logout: async ({ set }) => {
    try {
      set.headers[
        "Set-Cookie"
      ] = `token=; HttpOnly; Secure; Path=/; SameSite=Strict; Max-Age=86400`;

      set.status = 200;
      return { ok: true };
    } catch (error) {
      console.error(error);
      set.status = 500;
      return { error: "เกิดข้อผิดพลาดภายในระบบ" };
    }
  },
  forgotpass_checkuser: async ({ body, set }) => {
    try {
      const { user_name, email } = body;
      if (!user_name || !email) {
        return (set.status = 400);
      }

      const user = await prisma.tb_user.findUnique({
        where: {
          user_name,
        },
        select: {
          user_id: true,
          first_name: true,
        },
      });
      if (!user) return { err: "ไม่พบผู้ใช้งาน" };

      const otp = generateOTP();

      const mailOptions = {
        from: "ecommerceezy@gmail.com", // แก้จาก form → from
        to: email,
        subject: "รหัสยืนยันตัวตนลืมรหัสผ่าน",
        html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
      <h2 style="text-align: center; color: #333;">🔒 ยืนยันตัวตนของคุณ</h2>
      <p style="font-size: 16px; color: #555;">
        สวัสดีคุณ <strong>${user.first_name}</strong>,
      </p>
      <p style="font-size: 16px; color: #555;">
        เราได้รับคำขอในการรีเซ็ตรหัสผ่านบัญชีของคุณ<br/>
        กรุณากรอกรหัส OTP ด้านล่างเพื่อตรวจสอบความถูกต้อง:
      </p>
      <div style="text-align: center; margin: 20px 0;">
        <span style="display: inline-block; background: #007bff; color: #fff; padding: 15px 30px; font-size: 24px; font-weight: bold; border-radius: 8px; letter-spacing: 3px;">
          ${otp}
        </span>
      </div>
  
      <hr/>
      <p style="font-size: 12px; color: #aaa; text-align: center;">
        หากคุณไม่ได้ทำรายการนี้ กรุณาละเว้นอีเมลฉบับนี้
      </p>
    </div>
  `,
      };

      await transporter.sendMail(mailOptions);

      set.status = 200;
      return {
        authPass: otp,
      };
    } catch (error) {
      console.error(error);
      return (set.status = 500);
    }
  },
  fotgotpass_updatePass: async ({ set, body }) => {
    try {
      const { user_name, password } = body;
      if (!user_name || !password) return (set.status = 400);

      const salt = await bcryptjs.genSalt(12);
      const hash = await bcryptjs.hash(password, salt);

      const update = await prisma.tb_user.update({
        where: {
          user_name,
        },
        data: {
          password: hash,
        },
      });

      set.status = 200;
      return { ok: true };
    } catch (error) {
      console.error(error);
      return (set.status = 500);
    }
  },
};
