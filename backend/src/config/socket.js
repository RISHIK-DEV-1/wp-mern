import { Server } from "socket.io";
import Message from "../models/Message.js";
import User from "../models/User.js";

export const onlineUsers = new Map();
const offlineTimers = new Map();
export let ioInstance = null;
export const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      credentials: true,
    },
  });
  ioInstance = io;
  io.on("connection", (socket) => {
    /* ================= JOIN ================= */

    socket.on("join", (userId) => {
      socket.userId = userId;

      if (offlineTimers.has(userId)) {
        clearTimeout(offlineTimers.get(userId));
        offlineTimers.delete(userId);
      }

      onlineUsers.set(String(userId), socket.id);

      io.emit("onlineUsers", Array.from(onlineUsers.keys()));
    });

    /* ================= SEND MESSAGE ================= */

    socket.on("sendMessage", async (message) => {
      try {
        const receiverSocketId = onlineUsers.get(String(message.receiver));
        const senderSocketId = onlineUsers.get(String(message.sender));

        let updatedMessage = message;

        if (receiverSocketId && message.status === "sent") {
          updatedMessage = await Message.findByIdAndUpdate(
            message._id,
            { status: "delivered" },
            { returnDocument: "after" }
          ).populate("replyTo", "text sender");
        } else {
          updatedMessage = await Message.findById(message._id).populate(
            "replyTo",
            "text sender"
          );
        }

        if (receiverSocketId) {
          io.to(receiverSocketId).emit("receiveMessage", updatedMessage);
          io.to(receiverSocketId).emit("unreadCountUpdated");
        }

        if (senderSocketId) {
          io.to(senderSocketId).emit("receiveMessage", updatedMessage);
          io.to(senderSocketId).emit("messageStatusUpdated", updatedMessage);
        }

        io.emit("chatListUpdated");
      } catch (error) {
        console.log(error);
      }
    });

    /* ================= MARK READ ================= */

    /* ================= MARK CONVERSATION READ ================= */

socket.on(
  "conversationRead",
  async ({
    senderId,
    receiverId,
  }) => {
    try {
      const receiverSocketId =
        onlineUsers.get(
          String(receiverId)
        );

      if (receiverSocketId) {
        io.to(receiverSocketId).emit(
          "unreadCountUpdated"
        );
      }

      const senderSocketId =
        onlineUsers.get(
          String(senderId)
        );

      if (senderSocketId) {
        const updatedMessages =
          await Message.find({
            sender: senderId,
            receiver: receiverId,
            status: "read",
          }).populate(
            "replyTo",
            "text sender"
          );

        updatedMessages.forEach(
          (message) => {
            io.to(senderSocketId).emit(
              "messageStatusUpdated",
              message
            );
          }
        );
      }
    } catch (err) {
      console.log(err);
    }
  }
); 
    /* ================= TYPING ================= */

    socket.on("typing", ({ sender, receiver }) => {
      const receiverSocketId = onlineUsers.get(String(receiver));

      if (receiverSocketId) {
        io.to(receiverSocketId).emit("typing", { sender });
      }
    });

    /* ================= STOP TYPING ================= */

    socket.on("stopTyping", ({ sender, receiver }) => {
      const receiverSocketId = onlineUsers.get(String(receiver));

      if (receiverSocketId) {
        io.to(receiverSocketId).emit("stopTyping", { sender });
      }
    });

    /* ================= REACTIONS (NEW) ================= */

    socket.on("reactMessage", async ({ messageId, userId, emoji }) => {
      try {
        const msg = await Message.findById(messageId);
        if (!msg) return;

        const existingIndex = msg.reactions.findIndex(
          (r) => String(r.user) === String(userId)
        );

        if (existingIndex !== -1) {
          if (msg.reactions[existingIndex].emoji === emoji) {
            msg.reactions.splice(existingIndex, 1);
          } else {
            msg.reactions[existingIndex].emoji = emoji;
          }
        } else {
          msg.reactions.push({ user: userId, emoji });
        }

        await msg.save();

        const updatedMessage = await Message.findById(messageId)
          .populate("replyTo", "text sender");

        const receiverSocketId = onlineUsers.get(String(updatedMessage.receiver));
        const senderSocketId = onlineUsers.get(String(updatedMessage.sender));

        if (receiverSocketId) {
          io.to(receiverSocketId).emit(
            "messageReactionUpdated",
            updatedMessage
          );
        }

        if (senderSocketId) {
          io.to(senderSocketId).emit(
            "messageReactionUpdated",
            updatedMessage
          );
        }
      } catch (err) {
        console.log("Reaction error:", err.message);
      }
    });
   /* ================= MESSAGE DELETED ================= */

socket.on("messageDeleted", async (messageId) => {
  try {
    const updatedMessage =
      await Message.findById(messageId)
        .populate("replyTo", "text sender");

    if (!updatedMessage) return;

    io.emit(
      "messageStatusUpdated",
      updatedMessage
    );

    io.emit("chatListUpdated");
  } catch (error) {
    console.log(error);
  }
});

    /* ================= DISCONNECT ================= */

    socket.on("disconnect", () => {
      const userId = socket.userId;

      if (!userId) return;

      const disconnectedSocketId = socket.id;

      const timer = setTimeout(async () => {
        try {
          const currentSocketId = onlineUsers.get(String(userId));

          if (currentSocketId !== disconnectedSocketId) {
            offlineTimers.delete(String(userId));
            return;
          }

          const updatedUser = await User.findByIdAndUpdate(
            userId,
            { lastSeen: new Date() },
            { returnDocument: "after" }
          );

          io.emit("lastSeenUpdated", {
            userId,
            lastSeen: updatedUser?.lastSeen,
          });

          onlineUsers.delete(String(userId));
          offlineTimers.delete(String(userId));

          io.emit("onlineUsers", Array.from(onlineUsers.keys()));
        } catch (error) {
          console.log(error);
        }
      }, 5000);

      offlineTimers.set(String(userId), timer);
    });
  });
};
