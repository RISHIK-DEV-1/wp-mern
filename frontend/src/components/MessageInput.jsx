import React, {
  useState,
  useContext,
  useRef,
} from "react";

import API from "../utils/axios";
import socket from "../utils/socket";

import { AuthContext } from "../context/AuthContext";

import "./MessageInput.css";

export default function MessageInput({
  selectedUser,
}) {
  const { user } =
    useContext(AuthContext);

  const [text, setText] =
    useState("");

  const typingTimeoutRef =
    useRef(null);

  /* ================= SEND MESSAGE ================= */

  const handleSend = async () => {
    if (!text.trim() || !selectedUser)
      return;

    try {
      const { data } =
        await API.post(
          "/messages",
          {
            sender: user._id,
            receiver:
              selectedUser._id,
            text,
          }
        );

      socket.emit(
        "sendMessage",
        data
      );

      socket.emit(
        "stopTyping",
        {
          sender: user._id,
          receiver:
            selectedUser._id,
        }
      );

      setText("");
    } catch (error) {
  console.error(
    "Failed to send message:",
    error
  );
}
  };

  /* ================= TYPING ================= */

  const handleTyping = (
    value
  ) => {
    if (!selectedUser) return;

    socket.emit("typing", {
      sender: user._id,
      receiver:
        selectedUser._id,
    });

    clearTimeout(
      typingTimeoutRef.current
    );

    typingTimeoutRef.current =
      setTimeout(() => {
        socket.emit(
          "stopTyping",
          {
            sender: user._id,
            receiver:
              selectedUser._id,
          }
        );
      }, 8000);
  };

  return (
    <div className="message-input">
      <input
        type="text"
        placeholder="Type a message..."
        value={text}
        onChange={(e) => {
          setText(
            e.target.value
          );

          handleTyping(
            e.target.value
          );
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleSend();
          }
        }}
      />

      <button
        onClick={handleSend}
      >
        Send
      </button>
    </div>
  );
}
