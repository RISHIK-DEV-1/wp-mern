import mongoose from "mongoose";
import Message from "../models/Message.js";

/* ================= SEND MESSAGE ================= */

export const sendMessage = async (req, res) => {
  try {
    const { sender, receiver, text, replyTo } = req.body;

    if (!sender || !receiver || !text?.trim()) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const message = await Message.create({
      sender,
      receiver,
      text,
      replyTo: replyTo || null,
      status: "sent",
    });

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= GET MESSAGES ================= */

export const getMessages = async (req, res) => {
  try {
    const { senderId, receiverId } = req.params;

    const messages = await Message.find({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId },
      ],
      deletedFor: {
        $ne: senderId,
      },
    })
      .populate("replyTo", "text sender")
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= MARK DELIVERED ================= */

export const markDelivered = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findByIdAndUpdate(
      messageId,
      { status: "delivered" },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    res.json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= MARK READ ================= */

export const markRead = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findByIdAndUpdate(
      messageId,
      { status: "read" },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    res.json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= GET UNREAD COUNTS ================= */

export const getUnreadCounts = async (req, res) => {
  try {
    const { userId } = req.params;

    const unreadMessages = await Message.aggregate([
      {
        $match: {
          receiver: new mongoose.Types.ObjectId(userId),
          status: { $ne: "read" },
        },
      },
      {
        $group: {
          _id: "$sender",
          count: { $sum: 1 },
        },
      },
    ]);

    const counts = {};
    unreadMessages.forEach((item) => {
      counts[item._id.toString()] = item.count;
    });

    res.json(counts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= GET CHAT PREVIEWS ================= */

export const getChatPreviews = async (req, res) => {
  try {
    const { userId } = req.params;

    const messages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }],
    deletedFor: {
    $ne: userId,
  },
    })
      .sort({ createdAt: -1 })
      .populate("sender receiver", "name avatar lastSeen");

    const chats = {};

    messages.forEach((message) => {
      const otherUser =
        String(message.sender._id) === String(userId)
          ? message.receiver
          : message.sender;

      if (!chats[otherUser._id]) {
        chats[otherUser._id] = {
          user: otherUser,
          lastMessage: message.deletedForEveryone
    ? String(message.sender._id) === String(userId)
      ? "You deleted this message"
      : "This message was deleted"
    : message.text,
          lastMessageTime: message.createdAt,
          lastSender: String(message.sender._id),
          status: message.status,
        };
      }
    });

    res.json(Object.values(chats));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= TOGGLE REACTION ================= */

export const toggleReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId, emoji } = req.body;

    if (!userId || !emoji) {
      return res.status(400).json({ message: "userId and emoji required" });
    }

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    const existingIndex = message.reactions.findIndex(
      (r) => String(r.user) === String(userId)
    );

    // If same emoji clicked again → remove reaction
    if (existingIndex !== -1) {
      if (message.reactions[existingIndex].emoji === emoji) {
        message.reactions.splice(existingIndex, 1);
      } else {
        // change reaction
        message.reactions[existingIndex].emoji = emoji;
      }
    } else {
      message.reactions.push({ user: userId, emoji });
    }

    await message.save();

    const updatedMessage = await Message.findById(messageId)
      .populate("replyTo", "text sender");

    res.json(updatedMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
/* ================= DELETE FOR ME ================= */

export const deleteForMe = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId } = req.body;

    const message = await Message.findById(messageId);

    if (!message) {
      return res
        .status(404)
        .json({ message: "Message not found" });
    }

    if (
      !message.deletedFor.some(
        (id) => String(id) === String(userId)
      )
    ) {
      message.deletedFor.push(userId);
    }

    await message.save();

    res.json(message);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

/* ================= DELETE FOR EVERYONE ================= */

export const deleteForEveryone = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId } = req.body;

    const message = await Message.findById(messageId);

    if (!message) {
      return res
        .status(404)
        .json({ message: "Message not found" });
    }

    if (
      String(message.sender) !== String(userId)
    ) {
      return res.status(403).json({
        message:
          "Only sender can delete for everyone",
      });
    }

    message.deletedForEveryone = true;
    message.reactions = [];
    await message.save();

    const updatedMessage =
      await Message.findById(messageId)
        .populate(
          "replyTo",
          "text sender"
        );

    res.json(updatedMessage);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
