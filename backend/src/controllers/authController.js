import bcrypt from "bcryptjs";
import crypto from "crypto";

import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import sendEmail from "../utils/sendEmail.js";
/* ================= PASSWORD VALIDATION ================= */

const isStrongPassword = (password) => {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(
    password
  );
};
/* ================= REGISTER ================= */

export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name.trim()) {
      return res.status(400).json({
        message: "Name is required",
      });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        message:
          "Password must contain at least 8 characters, one uppercase letter, one lowercase letter and one number",
      });
    }

    const userExists = await User.findOne({
      email,
    });

    if (userExists) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const salt = await bcrypt.genSalt(10);

    const hashedPassword = await bcrypt.hash(
      password,
      salt
    );

    const verificationToken =
      crypto.randomBytes(32).toString("hex");

    const user = await User.create({
      name,
      email,
      password: hashedPassword,

      isVerified: false,

      verificationToken,

      verificationExpires:
        Date.now() + 1000 * 60 * 60, // 1 hour
    });

    const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;

    await sendEmail({
      to: user.email,
      subject: "Verify Your Email",
      html: `
        <h2>Welcome to WP MERN Chat</h2>

        <p>Please verify your email by clicking the button below.</p>

        <a
          href="${verifyUrl}"
          style="
            display:inline-block;
            padding:12px 20px;
            background:#00a884;
            color:white;
            text-decoration:none;
            border-radius:6px;
          "
        >
          Verify Email
        </a>

        <p>This link expires in 1 hour.</p>
      `,
    });

    res.status(201).json({
      message:
        "Verification email sent. Please check your inbox.",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

/* ================= VERIFY EMAIL ================= */

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      verificationToken: token,

      verificationExpires: {
        $gt: Date.now(),
      },
    });

    if (!user) {
      return res.status(400).json({
        message:
          "Invalid or expired verification link",
      });
    }

    user.isVerified = true;

    user.verificationToken = null;
    user.verificationExpires = null;

    await user.save();

    res.json({
      message:
        "Email verified successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

/* ================= RESEND VERIFICATION ================= */

export const resendVerificationEmail =
  async (req, res) => {
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

      if (user.isVerified) {
        return res.status(400).json({
          message:
            "Email already verified",
        });
      }

      const verificationToken =
        crypto
          .randomBytes(32)
          .toString("hex");

      user.verificationToken =
        verificationToken;

      user.verificationExpires =
        Date.now() +
        1000 * 60 * 60; // 1 hour

      await user.save();

      const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;

      await sendEmail({
        to: user.email,
        subject:
          "Resend Email Verification",

        html: `
          <h2>Verify Your Email</h2>

          <p>Please click below to verify your account.</p>

          <a
            href="${verifyUrl}"
            style="
              display:inline-block;
              padding:12px 20px;
              background:#00a884;
              color:white;
              text-decoration:none;
              border-radius:6px;
            "
          >
            Verify Email
          </a>

          <p>This link expires in 1 hour.</p>
        `,
      });

      res.json({
        message:
          "Verification email sent successfully",
      });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
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
      1000 * 60 * 60; // 1 hour

    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

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

    /* Password strength validation */

if (!isStrongPassword(password)) {
  return res.status(400).json({
    message:
      "Password must contain at least 8 characters, one uppercase letter, one lowercase letter and one number",
  });
}

    /* New password must not be same as old password */

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

    /* Hash new password */

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

/* ================= LOGIN ================= */

export const loginUser = async (
  req,
  res
) => {
  try {
    const { email, password } =
      req.body;

    const user = await User.findOne({
      email,
    });

    if (!user) {
      return res.status(401).json({
        message:
          "Invalid credentials",
      });
    }

    const isMatch =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!isMatch) {
      return res.status(401).json({
        message:
          "Invalid credentials",
      });
    }

    if (!user.isVerified) {
      return res.status(401).json({
        message:
          "Please verify your email before logging in",
      });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(
        user._id
      ),
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

/* ================= GET USERS ================= */

export const getUsers = async (
  req,
  res
) => {
  try {
    const users =
      await User.find().select(
        "-password"
      );

    res.json(users);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
