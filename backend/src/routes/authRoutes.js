import express from "express";

import {
  registerUser,
  loginUser,
  googleLogin,
  verifyEmail,
  resendVerificationEmail,
} from "../controllers/authController.js";

import {
  forgotPassword,
  resetPassword,
} from "../controllers/passwordController.js";

import {
  getUsers,
  updateAvatar,
} from "../controllers/userController.js";

const router = express.Router();

/* AUTH */
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/google-login", googleLogin);

/* EMAIL VERIFICATION */
router.get("/verify-email/:token", verifyEmail);

router.post(
  "/resend-verification",
  resendVerificationEmail
);

/* PASSWORD RESET */
router.post(
  "/forgot-password",
  forgotPassword
);

router.post(
  "/reset-password/:token",
  resetPassword
);

/* USERS */
router.get("/users", getUsers);

/* AVATAR */
router.put(
  "/avatar",
  updateAvatar
);

export default router;
