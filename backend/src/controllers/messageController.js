import mongoose from "mongoose";
import Message from "../models/Message.js";

/* ================= SEND MESSAGE ================= */

export const sendMessage = async (req, res) => {
  try {
    const { sender, receiver, text } = req.body;

    if (!sender || !receiver || !text?.trim()) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const message = await Message.create({
      sender,
      receiver,
      text,
      status: "sent",
    });

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

/* ================= GET MESSAGES ================= */

export const getMessages = async (req, res) => {
  try {
    const { senderId, receiverId } = req.params;

    const messages = await Message.find({
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

/* ================= MARK DELIVERED ================= */

export const markDelivered = async (
  req,
  res
) => {
  try {
    const { messageId } = req.params;

    const message =
      await Message.findByIdAndUpdate(
        messageId,
        { status: "delivered" },
        { new: true }
      );

    if (!message) {
      return res.status(404).json({
        message: "Message not found",
      });
    }

    res.json(message);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

/* ================= MARK READ ================= */

export const markRead = async (
  req,
  res
) => {
  try {
    const { messageId } = req.params;

    const message =
      await Message.findByIdAndUpdate(
        messageId,
        { status: "read" },
        { new: true }
      );

    if (!message) {
      return res.status(404).json({
        message: "Message not found",
      });
    }

    res.json(message);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
/* ================= GET UNREAD COUNTS ================= */

export const getUnreadCounts = async (
  req,
  res
) => {
  try {
    const { userId } = req.params;

    const unreadMessages =
      await Message.aggregate([
        {
          $match: {
            receiver:
              new mongoose.Types.ObjectId(
                userId
              ),
            status: {
              $ne: "read",
            },
          },
        },
        {
          $group: {
            _id: "$sender",
            count: {
              $sum: 1,
            },
          },
        },
      ]);

    const counts = {};

    unreadMessages.forEach(
      (item) => {
        counts[item._id.toString()] =
          item.count;
      }
    );

    res.json(counts);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
