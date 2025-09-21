import nodemailler from "nodemailer";
import "dotenv/config";
export const transporter = nodemailler.createTransport({
  host: process.env.mail_server,
  port: process.env.mail_port,
  auth: {
    user: process.env.mail_user,
    pass: process.env.mail_pass,
  },
});
