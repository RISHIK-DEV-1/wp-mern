import bcrypt from "bcryptjs";
import crypto from "crypto";

import User from "../models/User.js";

/* ================= PASSWORD VALIDATION ================= */

const isStrongPassword = (password) => {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(
    password
  );
};

/* ================= FORGOT PASSWORD ================= */

export const forgotPassword = async (
  req,
  res
) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({
      email,
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const resetToken =
      crypto.randomBytes(32).toString(
        "hex"
      );

    user.resetPasswordToken =
      resetToken;

    user.resetPasswordExpires =
      Date.now() +
      1000 * 60 * 60;

    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    const sendEmail =
      (await import("../utils/sendEmail.js"))
        .default;

    await sendEmail({
      to: user.email,
      subject: "Reset Password",
      html: `
        <h2>Password Reset Request</h2>

        <p>Click the button below to reset your password.</p>

        <a
          href="${resetUrl}"
          style="
            display:inline-block;
            padding:12px 20px;
            background:#00a884;
            color:white;
            text-decoration:none;
            border-radius:6px;
          "
        >
          Reset Password
        </a>

        <p>This link expires in 1 hour.</p>
      `,
    });

    res.json({
      message:
        "Password reset link sent to your email",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

/* ================= RESET PASSWORD ================= */

export const resetPassword = async (
  req,
  res
) => {
  try {
    const { token } = req.params;

    const { password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,

      resetPasswordExpires: {
        $gt: Date.now(),
      },
    });

    if (!user) {
      return res.status(400).json({
        message:
          "Invalid or expired reset link",
      });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        message:
          "Password must contain at least 8 characters, one uppercase letter, one lowercase letter and one number",
      });
    }

    const isSamePassword =
      await bcrypt.compare(
        password,
        user.password
      );

    if (isSamePassword) {
      return res.status(400).json({
        message:
          "New password cannot be the same as old password",
      });
    }

    const salt =
      await bcrypt.genSalt(10);

    user.password =
      await bcrypt.hash(
        password,
        salt
      );

    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await user.save();

    res.json({
      message:
        "Password reset successful",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
