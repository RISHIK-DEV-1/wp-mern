import nodemailer from "nodemailer";

const transporter =
  nodemailer.createTransport({
    service: "gmail",

    auth: {
      user: process.env.EMAIL_USER,

      pass: process.env.EMAIL_PASS,
    },
  });

const sendEmail = async ({
  to,
  subject,
  html,
}) => {
  try {
    await transporter.sendMail({
      from: `"WP MERN Chat" <${process.env.EMAIL_USER}>`,

      to,

      subject,

      html,
    });

    console.log(
      `Email sent to ${to}`
    );
  } catch (error) {
    console.log(
      "Email Error:",
      error.message
    );

    throw error;
  }
};

export default sendEmail;
