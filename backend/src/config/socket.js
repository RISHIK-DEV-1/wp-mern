import { Server } from "socket.io";

const onlineUsers = new Map();
const offlineTimers = new Map();

export const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    /* ================= JOIN ================= */
    socket.on("join", (userId) => {
      socket.userId = userId;

      if (offlineTimers.has(userId)) {
        clearTimeout(offlineTimers.get(userId));
        offlineTimers.delete(userId);
      }

      onlineUsers.set(userId, socket.id);

      io.emit(
        "onlineUsers",
        Array.from(onlineUsers.keys())
      );
    });

    /* ================= SEND MESSAGE ================= */
    socket.on("sendMessage", (message) => {
      const receiverSocketId = onlineUsers.get(
        message.receiver
      );

      if (receiverSocketId) {
        io.to(receiverSocketId).emit(
          "receiveMessage",
          message
        );
      }
    });

    /* ================= TYPING ================= */
    socket.on(
      "typing",
      ({ sender, receiver }) => {
        const receiverSocketId =
          onlineUsers.get(receiver);

        if (receiverSocketId) {
          io.to(receiverSocketId).emit(
            "typing",
            { sender }
          );
        }
      }
    );

    /* ================= STOP TYPING ================= */
    socket.on(
      "stopTyping",
      ({ sender, receiver }) => {
        const receiverSocketId =
          onlineUsers.get(receiver);

        if (receiverSocketId) {
          io.to(receiverSocketId).emit(
            "stopTyping",
            { sender }
          );
        }
      }
    );

    /* ================= DISCONNECT ================= */
    socket.on("disconnect", () => {
      const userId = socket.userId;

      if (!userId) return;

      const timer = setTimeout(() => {
        onlineUsers.delete(userId);
        offlineTimers.delete(userId);

        io.emit(
          "onlineUsers",
          Array.from(onlineUsers.keys())
        );
      }, 5000);

      offlineTimers.set(userId, timer);
    });
  });
};
