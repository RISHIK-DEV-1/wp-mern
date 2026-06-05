import Message from "../models/Message.js";

/* ================= SEND MESSAGE ================= */

export const sendMessage = async (
  req,
  res
) => {
  try {
    const {
      sender,
      receiver,
      text,
    } = req.body;

    if (
      !sender ||
      !receiver ||
      !text?.trim()
    ) {
      return res.status(400).json({
        message:
          "All fields are required",
      });
    }

    const message =
      await Message.create({
        sender,
        receiver,
        text,
      });

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

/* ================= GET MESSAGES ================= */

export const getMessages =
  async (req, res) => {
    try {
      const {
        senderId,
        receiverId,
      } = req.params;

      const messages =
        await Message.find({
          $or: [
            {
              sender: senderId,
              receiver: receiverId,
            },
            {
              sender: receiverId,
              receiver: senderId,
            },
          ],
        }).sort({
          createdAt: 1,
        });

      res.json(messages);
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  };
