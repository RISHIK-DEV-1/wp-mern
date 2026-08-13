import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    /* ================= BASIC USER INFO ================= */

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    /* ================= AUTHENTICATION ================= */

    password: {
      type: String,
      default: null,
    },

    /*
     * Only Google users have this field.
     *
     * Email/password users simply don't have
     * a googleId field.
     *
     * sparse + unique allows multiple users
     * without googleId.
     */
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },

    /* ================= PROFILE ================= */

    avatar: {
      type: String,
      default: "",
    },

    lastSeen: {
      type: Date,
      default: Date.now,
    },

    /* ================= PASSWORD RESET ================= */

    resetPasswordToken: {
      type: String,
      default: null,
    },

    resetPasswordExpires: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "User",
  userSchema
);
