import { Server } from "socket.io";
import Message from "../models/Message.js";
import User from "../models/User.js";

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
        clearTimeout(
          offlineTimers.get(userId)
        );

        offlineTimers.delete(userId);
      }

      onlineUsers.set(
        String(userId),
        socket.id
      );

      io.emit(
        "onlineUsers",
        Array.from(
          onlineUsers.keys()
        )
      );
    });

    /* ================= SEND MESSAGE ================= */

    socket.on(
      "sendMessage",
      async (message) => {
        try {
          const receiverSocketId =
            onlineUsers.get(
              String(message.receiver)
            );

          const senderSocketId =
            onlineUsers.get(
              String(message.sender)
            );

          let updatedMessage =
            message;

          /* Receiver online -> Delivered */

          if (
            receiverSocketId &&
            message.status === "sent"
          ) {
            updatedMessage =
              await Message.findByIdAndUpdate(
                message._id,
                {
                  status:
                    "delivered",
                },
                {
                  returnDocument:
                    "after",
                }
              );
          }

          /* Send to receiver */

          if (receiverSocketId) {
            io.to(
              receiverSocketId
            ).emit(
              "receiveMessage",
              updatedMessage
            );

            io.to(
              receiverSocketId
            ).emit(
              "unreadCountUpdated"
            );
          }

          /* Update sender instantly */

          if (senderSocketId) {
            io.to(
              senderSocketId
            ).emit(
              "receiveMessage",
              updatedMessage
            );

            io.to(
              senderSocketId
            ).emit(
              "messageStatusUpdated",
              updatedMessage
            );
          }
        } catch (error) {
          console.log(error);
        }
      }
    );

    /* ================= MARK READ ================= */

    socket.on(
      "markRead",
      async (messageId) => {
        try {
          const message =
            await Message.findByIdAndUpdate(
              messageId,
              {
                status: "read",
              },
              {
                returnDocument:
                  "after",
              }
            );

          if (!message) return;

          const senderSocketId =
            onlineUsers.get(
              String(
                message.sender
              )
            );

          if (senderSocketId) {
            io.to(
              senderSocketId
            ).emit(
              "messageStatusUpdated",
              message
            );
          }

          const receiverSocketId =
            onlineUsers.get(
              String(
                message.receiver
              )
            );

          if (receiverSocketId) {
            io.to(
              receiverSocketId
            ).emit(
              "unreadCountUpdated"
            );
          }
        } catch (error) {
          console.log(error);
        }
      }
    );

    /* ================= TYPING ================= */

    socket.on(
      "typing",
      ({
        sender,
        receiver,
      }) => {
        const receiverSocketId =
          onlineUsers.get(
            String(receiver)
          );

        if (receiverSocketId) {
          io.to(
            receiverSocketId
          ).emit(
            "typing",
            { sender }
          );
        }
      }
    );

    /* ================= STOP TYPING ================= */

    socket.on(
      "stopTyping",
      ({
        sender,
        receiver,
      }) => {
        const receiverSocketId =
          onlineUsers.get(
            String(receiver)
          );

        if (receiverSocketId) {
          io.to(
            receiverSocketId
          ).emit(
            "stopTyping",
            { sender }
          );
        }
      }
    );

    /* ================= DISCONNECT ================= */

    socket.on(
      "disconnect",
      () => {
        const userId =
          socket.userId;

        if (!userId) return;

        const timer =
          setTimeout(
            async () => {
              try {
                const updatedUser =
                  await User.findByIdAndUpdate(
                    userId,
                    {
                      lastSeen:
                        new Date(),
                    },
                    {
                      returnDocument:
                        "after",
                    }
                  );

                io.emit(
                  "lastSeenUpdated",
                  {
                    userId,
                    lastSeen:
                      updatedUser?.lastSeen,
                  }
                );

                onlineUsers.delete(
                  String(userId)
                );

                offlineTimers.delete(
                  String(userId)
                );

                io.emit(
                  "onlineUsers",
                  Array.from(
                    onlineUsers.keys()
                  )
                );
              } catch (error) {
                console.log(error);
              }
            },
            5000
          );

        offlineTimers.set(
          String(userId),
          timer
        );
      }
    );
  });
};
