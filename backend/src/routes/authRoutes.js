import express from "express";

import {
  registerUser,
  loginUser,
  getUsers,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";

const router = express.Router();

/* AUTH */
router.post("/register", registerUser);
router.post("/login", loginUser);

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

export default router;
