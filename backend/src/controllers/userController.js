import User from "../models/User.js";
import cloudinary from "../config/cloudinary.js";

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

/* ================= UPDATE AVATAR ================= */

export const updateAvatar =
  async (req, res) => {
    try {
      const { userId, avatar } =
        req.body;

      if (!userId || !avatar) {
        return res.status(400).json({
          message:
            "User ID and avatar are required",
        });
      }

      const uploadResult =
        await cloudinary.uploader.upload(
          avatar,
          {
            folder:
              "wp-mern-avatars",
            timeout: 60000,
          }
        );

      const user =
        await User.findByIdAndUpdate(
          userId,
          {
            avatar:
              uploadResult.secure_url,
          },
          {
            returnDocument: "after",
          }
        ).select("-password");

      if (!user) {
        return res.status(404).json({
          message:
            "User not found",
        });
      }

      res.json(user);
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  };
