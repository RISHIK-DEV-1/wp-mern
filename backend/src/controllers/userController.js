import User from "../models/User.js";

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
