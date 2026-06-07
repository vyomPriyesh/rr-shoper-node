import nodemailer from 'nodemailer'
import "dotenv/config";

const emailotpsending = nodemailer.createTransport({
    host: "smtpout.secureserver.net",
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

export default emailotpsending;