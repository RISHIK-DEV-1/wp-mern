import React, {
  useEffect,
  useContext,
  useRef,
} from "react";

import API from "../utils/axios";
import socket from "../utils/socket";

import { AuthContext } from "../context/AuthContext";

import "./MessageList.css";

export default function MessageList({
  selectedUser,
  messages,
  setMessages,
}) {
  const { user } = useContext(AuthContext);

  const messagesEndRef = useRef(null);

  /* ================= FETCH MESSAGES ================= */

  const fetchMessages = async () => {
    if (!selectedUser) return;

    try {
      const { data } = await API.get(
        `/messages/${user._id}/${selectedUser._id}`
      );

      setMessages(data);
    } catch (error) {
      console.error(
    "Failed to fetch messages:",
    error.message
  );
    }
  };

  /* ================= LOAD CHAT ================= */

  useEffect(() => {
    fetchMessages();
  }, [selectedUser]);

  /* ================= RECEIVE MESSAGE / STATUS UPDATE ================= */

  useEffect(() => {
    const handleMessageUpdate = (
      message
    ) => {
      const senderId = String(
        message.sender
      );

      const receiverId = String(
        message.receiver
      );

      const selectedId = String(
        selectedUser?._id
      );

      if (
        senderId === selectedId ||
        receiverId === selectedId
      ) {
        setMessages((prev) => {
          const exists = prev.some(
            (msg) =>
              msg._id === message._id
          );

          if (exists) {
            return prev.map((msg) =>
              msg._id === message._id
                ? message
                : msg
            );
          }

          return [...prev, message];
        });
      }
    };

    socket.on(
      "receiveMessage",
      handleMessageUpdate
    );

    socket.on(
      "messageStatusUpdated",
      handleMessageUpdate
    );

    return () => {
      socket.off(
        "receiveMessage",
        handleMessageUpdate
      );

      socket.off(
        "messageStatusUpdated",
        handleMessageUpdate
      );
    };
  }, [selectedUser, setMessages]);

  /* ================= MARK AS READ ================= */

  useEffect(() => {
    if (!selectedUser) return;

    messages.forEach((message) => {
      const isIncoming =
        String(message.sender) ===
        String(selectedUser._id);

      if (
        isIncoming &&
        message.status !== "read"
      ) {
        socket.emit(
          "markRead",
          message._id
        );
      }
    });
  }, [messages, selectedUser]);

  /* ================= AUTO SCROLL ================= */

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView(
      {
        behavior: "smooth",
      }
    );
  }, [messages]);

  /* ================= STATUS ICON ================= */

  const getStatusIcon = (
    message
  ) => {
    if (
      String(message.sender) !==
      String(user._id)
    ) {
      return null;
    }

    switch (message.status) {
      case "sending":
        return "⏰";

      case "sent":
        return "✓";

      case "delivered":
        return "✓✓";

      case "read":
        return (
          <span
            style={{
              color: "#4fc3f7",
            }}
          >
            ✓✓
          </span>
        );

      default:
        return "✓";
    }
  };

  return (
    <div className="messages">
      {messages.map((message) => (
        <div
          key={message._id}
          className={`message ${
            String(message.sender) ===
            String(user._id)
              ? "sent"
              : "received"
          }`}
        >
          <div>{message.text}</div>

          <small className="message-time">
            {new Date(
              message.createdAt
            ).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}

            {" "}
            {getStatusIcon(message)}
          </small>
        </div>
      ))}

      <div ref={messagesEndRef} />
    </div>
  );
}
