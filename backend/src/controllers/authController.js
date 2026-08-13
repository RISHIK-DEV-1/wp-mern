import bcrypt from "bcryptjs";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";

import PendingUser from "../models/PendingUser.js";
import User from "../models/User.js";

import generateToken from "../utils/generateToken.js";
import sendEmail from "../utils/sendEmail.js";

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID
);

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

    if (!name?.trim()) {
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

    /*
     * USER collection contains VERIFIED USERS ONLY.
     */
    const verifiedUser = await User.findOne({
      email,
    });

    if (verifiedUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    /*
     * If the same email previously started registration
     * but did not verify, remove the old pending record.
     */
    await PendingUser.deleteOne({
      email,
    });

    const salt = await bcrypt.genSalt(10);

    const hashedPassword =
      await bcrypt.hash(password, salt);

    const verificationToken =
      crypto.randomBytes(32).toString("hex");

    await PendingUser.create({
      name: name.trim(),
      email,
      password: hashedPassword,
      verificationToken,
      verificationExpires:
        Date.now() + 1000 * 60 * 60,
    });

    const verifyUrl =
      `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;

    await sendEmail({
      to: email,
      subject: "Verify Your Email",
      html: `
        <h2>Welcome to WP MERN Chat</h2>

        <p>Please verify your email to complete your registration.</p>

        <a
          href="${verifyUrl}"
          style="
            display:inline-block;
            padding:10px 15px;
            background:#00a884;
            color:#fff;
            text-decoration:none;
            border-radius:6px;
          "
        >
          Verify Email
        </a>

        <p>This verification link expires in 1 hour.</p>
      `,
    });

    res.status(201).json({
      message:
        "Verification email sent. Please check your inbox.",
    });
  } catch (error) {
    console.log(
      "Register Error:",
      error.message
    );

    res.status(500).json({
      message: error.message,
    });
  }
};

/* ================= VERIFY EMAIL ================= */

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const pendingUser =
      await PendingUser.findOne({
        verificationToken: token,
        verificationExpires: {
          $gt: Date.now(),
        },
      });

    if (!pendingUser) {
      return res.status(400).json({
        message:
          "Invalid or expired verification link",
      });
    }

    /*
     * Safety check:
     * The email may have already been registered
     * through another authentication method.
     */
    const existingUser =
      await User.findOne({
        email: pendingUser.email,
      });

    if (existingUser) {
      await PendingUser.deleteOne({
        _id: pendingUser._id,
      });

      return res.json({
        message: "Email already verified",
      });
    }

    /*
     * Move the verified user from PendingUser
     * into the master User collection.
     *
     * IMPORTANT:
     * Do NOT set googleId: null.
     */
    await User.create({
      name: pendingUser.name,
      email: pendingUser.email,
      password: pendingUser.password,
      avatar: "",
      lastSeen: new Date(),
      resetPasswordToken: null,
      resetPasswordExpires: null,
    });

    /*
     * Verification is complete.
     * Remove the temporary pending record.
     */
    await PendingUser.deleteOne({
      _id: pendingUser._id,
    });

    res.json({
      message: "Email verified successfully",
    });
  } catch (error) {
    console.log(
      "Verify Email Error:",
      error.message
    );

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

      const user =
        await PendingUser.findOne({
          email,
        });

      if (!user) {
        return res.status(404).json({
          message:
            "No pending verification found for this email",
        });
      }

      const verificationToken =
        crypto.randomBytes(32).toString("hex");

      user.verificationToken =
        verificationToken;

      user.verificationExpires =
        Date.now() +
        1000 * 60 * 60;

      await user.save();

      const verifyUrl =
        `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;

      await sendEmail({
        to: email,
        subject:
          "Resend Email Verification",
        html: `
          <h2>Verify Your Email</h2>

          <p>Please click the button below to verify your email.</p>

          <a
            href="${verifyUrl}"
            style="
              display:inline-block;
              padding:10px 15px;
              background:#00a884;
              color:white;
              text-decoration:none;
              border-radius:6px;
            "
          >
            Verify Email
          </a>

          <p>This verification link expires in 1 hour.</p>
        `,
      });

      res.json({
        message:
          "Verification email sent successfully",
      });
    } catch (error) {
      console.log(
        "Resend Verification Error:",
        error.message
      );

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

    /*
     * ONLY search the master User collection.
     *
     * Pending/unverified users cannot log in.
     */
    const user = await User.findOne({ email });

if (!user) {
  const pendingUser =
    await PendingUser.findOne({ email });

  if (pendingUser) {
    return res.status(401).json({
      message:
        "Please verify your email before logging in",
    });
  }

  return res.status(401).json({
    message: "Invalid credentials",
  });
}

    /*
     * Google-only users don't have a password.
     */
    if (!user.password) {
      return res.status(401).json({
        message:
          "This account uses Google login. Please continue with Google.",
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

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar || "",
      token: generateToken(
        user._id
      ),
    });
  } catch (error) {
    console.log(
      "Login Error:",
      error.message
    );

    res.status(500).json({
      message: error.message,
    });
  }
};

/* ================= GOOGLE LOGIN ================= */

export const googleLogin = async (
  req,
  res
) => {
  try {
    const { credential } =
      req.body;

    if (!credential) {
      return res.status(400).json({
        message:
          "Google credential is required",
      });
    }

    const ticket =
      await googleClient.verifyIdToken({
        idToken: credential,
        audience:
          process.env.GOOGLE_CLIENT_ID,
      });

    const payload =
      ticket.getPayload();

    if (!payload) {
      return res.status(401).json({
        message:
          "Invalid Google credential",
      });
    }

    const {
      sub,
      name,
      email,
      picture,
      email_verified,
    } = payload;

    if (!email || !email_verified) {
      return res.status(401).json({
        message:
          "Google email could not be verified",
      });
    }

    /*
     * Find existing verified user by email.
     */
    let user =
      await User.findOne({
        email,
      });

    /*
     * New Google user:
     *
     * Google has already verified the account,
     * so directly create a verified master user.
     */
    if (!user) {
      user = await User.create({
        name: name || "Google User",
        email,
        googleId: sub,
        avatar: picture || "",
        password: null,
        lastSeen: new Date(),
      });
    } else {
      let updated = false;

      /*
       * Existing email/password user logging in
       * through Google for the first time.
       */
      if (
        !user.googleId
      ) {
        user.googleId = sub;
        updated = true;
      }

      /*
       * Keep the existing Cloudinary avatar.
       * Only use Google's picture if no avatar exists.
       */
      if (
        !user.avatar &&
        picture
      ) {
        user.avatar = picture;
        updated = true;
      }

      if (updated) {
        await user.save();
      }
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar || "",
      token: generateToken(
        user._id
      ),
    });
  } catch (error) {
    console.log(
      "Google Login Error:",
      error.message
    );

    res.status(500).json({
      message:
        "Google login failed",
    });
  }
};
