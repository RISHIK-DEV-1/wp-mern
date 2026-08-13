import bcrypt from "bcryptjs";
import crypto from "crypto";

import User from "../models/User.js";
import sendEmail from "../utils/sendEmail.js";

/* ================= PASSWORD VALIDATION ================= */

const isStrongPassword = (password) => {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(
    password
  );
};

/* ================= FORGOT PASSWORD ================= */

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({
      email,
    });

    /*
     * User collection contains only verified users.
     * Therefore, if the user exists, the account
     * is already verified.
     */
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    /*
     * Google-only users may not have a password.
     * They should use Google login instead of
     * password reset.
     */
    if (!user.password) {
      return res.status(400).json({
        message:
          "This account uses Google login. Please continue with Google.",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    user.resetPasswordToken = resetToken;

    user.resetPasswordExpires =
      Date.now() + 1000 * 60 * 60;

    await user.save();

    const resetUrl =
      `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    await sendEmail({
      to: user.email,
      subject: "Reset Password",
      html: `
        <h2>Password Reset Request</h2>

        <p>
          We received a request to reset your
          WP MERN Chat password.
        </p>

        <p>
          Click the button below to reset your password.
        </p>

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

        <p>
          This link expires in 1 hour.
        </p>

        <p>
          If you did not request a password reset,
          you can safely ignore this email.
        </p>
      `,
    });

    res.json({
      message:
        "Password reset link sent to your email",
    });
  } catch (error) {
    console.log(
      "Forgot password error:",
      error.message
    );

    res.status(500).json({
      message: "Failed to send password reset link",
    });
  }
};

/* ================= RESET PASSWORD ================= */

export const resetPassword = async (req, res) => {
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

    /*
     * Normally password-reset users are email/password
     * accounts, but this also safely handles a user whose
     * password field is null.
     */
    if (user.password) {
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
    }

    const salt = await bcrypt.genSalt(10);

    user.password =
      await bcrypt.hash(
        password,
        salt
      );

    /*
     * Password reset token must be removed immediately
     * after successful reset so it cannot be reused.
     */
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await user.save();

    res.json({
      message:
        "Password reset successful",
    });
  } catch (error) {
    console.log(
      "Reset password error:",
      error.message
    );

    res.status(500).json({
      message: "Password reset failed",
    });
  }
};
