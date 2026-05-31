import nodemailer from "nodemailer";

const sendEmail = async ({
  to,
  subject,
  html,
}) => {
  try {
    const transporter =
      nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

    await transporter.verify();

    await transporter.sendMail({
      from: `"WP MERN Chat" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
  } catch (error) {
    console.log(
      "Email Error:",
      error.message
    );
  }
};

export default sendEmail;
