import User from "../models/User.js";
import cloudinary from "../config/cloudinary.js";

/* ================= GET USERS / GLOBAL SEARCH ================= */

export const getUsers = async (req, res) => {
  try {
    const { search, userId } = req.query;

    const query = {};

    /*
     * Never return the currently logged-in user
     * in global search.
     */
    if (userId) {
      query._id = {
        $ne: userId,
      };
    }

    /*
     * Global search:
     *
     * Search the VERIFIED User collection only.
     *
     * Both name and email can be searched.
     */
    if (search?.trim()) {
      const searchText = search.trim();

      query.$or = [
        {
          name: {
            $regex: searchText,
            $options: "i",
          },
        },
        {
          email: {
            $regex: searchText,
            $options: "i",
          },
        },
      ];
    }

    const users = await User.find(query)
      .select(
        "-password -resetPasswordToken -resetPasswordExpires"
      )
      .sort({
        name: 1,
      });

    res.json(users);
  } catch (error) {
    console.error(
      "Get Users Error:",
      error.message
    );

    res.status(500).json({
      message: error.message,
    });
  }
};

/* ================= UPDATE AVATAR ================= */

export const updateAvatar = async (
  req,
  res
) => {
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
