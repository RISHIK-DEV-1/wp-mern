import React, {
  useState,
  useContext,
  useRef,
} from "react";

import {
  MdClose,
  MdReply,
  MdSend,
} from "react-icons/md";

import API from "../utils/axios";
import socket from "../utils/socket";

import { AuthContext } from "../context/AuthContext";

import "./MessageInput.css";

export default function MessageInput({
  selectedUser,
  onMessageSent,
  replyMessage,
  setReplyMessage,
}) {
  const { user } =
    useContext(AuthContext);

  const [text, setText] =
    useState("");

  const typingTimeoutRef =
    useRef(null);

  /* ================= SEND ================= */

  const handleSend = async () => {
    if (
      !text.trim() ||
      !selectedUser
    ) {
      return;
    }

    try {
      const { data } =
        await API.post(
          "/messages",
          {
            sender: user._id,
            receiver:
              selectedUser._id,
            text,
            replyTo:
              replyMessage?._id ||
              null,
          }
        );

      onMessageSent?.(data);

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

      setReplyMessage(null);
    } catch (error) {
      console.error(
        "Failed to send message:",
        error
      );
    }
  };

  /* ================= TYPING ================= */

  const handleTyping = () => {
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

  const replyUserName =
    String(replyMessage?.sender) ===
    String(user._id)
      ? "You"
      : selectedUser?.name;

  return (
    <>
      {/* ================= REPLY BAR ================= */}

      {replyMessage && (
        <div className="reply-bar">
          <div className="reply-bar-left">
            <MdReply
              className="reply-icon"
            />

            <div>
              <div className="reply-title">
                {replyUserName}
              </div>

              <div className="reply-text">
                {replyMessage.text}
              </div>
            </div>
          </div>

          <button
            className="reply-close"
            onClick={() =>
              setReplyMessage(
                null
              )
            }
          >
            <MdClose />
          </button>
        </div>
      )}

      {/* ================= INPUT ================= */}

      <div className="message-input">
        <input
          type="text"
          placeholder="Type a message"
          value={text}
          onChange={(e) => {
            setText(
              e.target.value
            );

            handleTyping();
          }}
          onKeyDown={(e) => {
            if (
              e.key === "Enter"
            ) {
              handleSend();
            }
          }}
        />

        <button
          onClick={handleSend}
        >
          <MdSend />
        </button>
      </div>
    </>
  );
}
