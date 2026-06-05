import React, {
  useEffect,
  useState,
  useContext,
  useRef,
} from "react";

import API from "../utils/axios";
import socket from "../utils/socket";

import { AuthContext } from "../context/AuthContext";

import "./MessageList.css";

export default function MessageList({
  selectedUser,
  newMessage,
}) {
  const { user } =
    useContext(AuthContext);

  const [messages, setMessages] =
    useState([]);

  const messagesEndRef =
    useRef(null);

  const fetchMessages =
    async () => {
      if (!selectedUser) return;

      try {
        const { data } =
          await API.get(
            `/messages/${user._id}/${selectedUser._id}`
          );

        setMessages(data);
      } catch (error) {
        console.log(error);
      }
    };

  /* Load chat when user changes */

  useEffect(() => {
    fetchMessages();
  }, [selectedUser]);

  /* Add newly sent message */

  useEffect(() => {
    if (!newMessage) return;

    setMessages((prev) => {
      const exists = prev.some(
        (msg) =>
          msg._id ===
          newMessage._id
      );

      return exists
        ? prev
        : [...prev, newMessage];
    });
  }, [newMessage]);

  /* Receive real-time messages */

  useEffect(() => {
    const handleReceiveMessage =
      (message) => {
        if (
          message.sender ===
            selectedUser?._id ||
          message.receiver ===
            selectedUser?._id
        ) {
          setMessages((prev) => {
            const exists =
              prev.some(
                (msg) =>
                  msg._id ===
                  message._id
              );

            return exists
              ? prev
              : [
                  ...prev,
                  message,
                ];
          });
        }
      };

    socket.on(
      "receiveMessage",
      handleReceiveMessage
    );

    return () => {
      socket.off(
        "receiveMessage",
        handleReceiveMessage
      );
    };
  }, [selectedUser]);

  /* Auto scroll */

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView(
      {
        behavior: "smooth",
      }
    );
  }, [messages]);

  return (
    <div className="messages">
      {messages.map(
        (message) => (
          <div
            key={message._id}
            className={`message ${
              message.sender ===
              user._id
                ? "sent"
                : "received"
            }`}
          >
            <div>
              {message.text}
            </div>

            <small className="message-time">
              {new Date(
                message.createdAt
              ).toLocaleTimeString(
                [],
                {
                  hour: "2-digit",
                  minute:
                    "2-digit",
                }
              )}
            </small>
          </div>
        )
      )}

      <div
        ref={messagesEndRef}
      ></div>
    </div>
  );
}
