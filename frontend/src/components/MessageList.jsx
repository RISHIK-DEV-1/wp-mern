import React, {
  useEffect,
  useContext,
  useRef,
  useState,
} from "react";

import {
  MdReply,
} from "react-icons/md";

import API from "../utils/axios";
import socket from "../utils/socket";

import { AuthContext } from "../context/AuthContext";

import "./MessageList.css";

export default function MessageList({
  selectedUser,
  messages,
  setMessages,
  setReplyMessage,
}) {
  const { user } =
    useContext(AuthContext);

  const messagesEndRef =
    useRef(null);

  const messageRefs =
    useRef({});

  const touchStartX =
    useRef(0);

  const touchEndX =
    useRef(0);

  const [swipingId, setSwipingId] =
    useState(null);

  const [swipeDistance, setSwipeDistance] =
    useState(0);

  /* ================= FETCH ================= */

  const fetchMessages = async () => {
    if (!selectedUser) return;

    try {
      const { data } =
        await API.get(
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

  useEffect(() => {
    fetchMessages();
  }, [selectedUser]);

  /* ================= RECEIVE ================= */

  useEffect(() => {
    const handleMessageUpdate =
      (message) => {
        const senderId =
          String(message.sender);

        const receiverId =
          String(message.receiver);

        const selectedId =
          String(
            selectedUser?._id
          );

        if (
          senderId === selectedId ||
          receiverId === selectedId
        ) {
          setMessages((prev) => {
            const exists =
              prev.some(
                (msg) =>
                  msg._id ===
                  message._id
              );

            if (exists) {
              return prev.map(
                (msg) =>
                  msg._id ===
                  message._id
                    ? message
                    : msg
              );
            }

            return [
              ...prev,
              message,
            ];
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
  }, [
    selectedUser,
    setMessages,
  ]);

  /* ================= MARK READ ================= */

  useEffect(() => {
    if (!selectedUser) return;

    messages.forEach(
      (message) => {
        const isIncoming =
          String(
            message.sender
          ) ===
          String(
            selectedUser._id
          );

        if (
          isIncoming &&
          message.status !==
            "read"
        ) {
          socket.emit(
            "markRead",
            message._id
          );
        }
      }
    );
  }, [
    messages,
    selectedUser,
  ]);

  /* ================= AUTO SCROLL ================= */

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView(
      {
        behavior: "smooth",
      }
    );
  }, [messages]);

  /* ================= STATUS ================= */

  const getStatusIcon = (
    message
  ) => {
    if (
      String(
        message.sender
      ) !==
      String(user._id)
    ) {
      return null;
    }

    switch (
      message.status
    ) {
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
              color:
                "#53bdeb",
            }}
          >
            ✓✓
          </span>
        );

      default:
        return "✓";
    }
  };

  /* ================= REPLY JUMP ================= */

  const scrollToMessage = (
    messageId
  ) => {
    const element =
      messageRefs.current[
        messageId
      ];

    if (!element) return;

    element.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    element.classList.add(
      "highlight-message"
    );

    setTimeout(() => {
      element.classList.remove(
        "highlight-message"
      );
    }, 2000);
  };

  /* ================= SWIPE ================= */

  const handleTouchStart =
    (e) => {
      touchStartX.current =
        e.changedTouches[0]
          .clientX;
    };

  const handleTouchMove = (
    e,
    message
  ) => {
    const distance =
      e.changedTouches[0]
        .clientX -
      touchStartX.current;

    if (distance > 0) {
      setSwipingId(
        message._id
      );

      setSwipeDistance(
        Math.min(distance, 80)
      );
    }
  };

  const handleTouchEnd = (
    e,
    message
  ) => {
    touchEndX.current =
      e.changedTouches[0]
        .clientX;

    const distance =
      touchEndX.current -
      touchStartX.current;

    if (distance > 60) {
      setReplyMessage(
        message
      );
    }

    setSwipingId(null);

    setSwipeDistance(0);
  };

  return (
    <div className="messages">
      {messages.map(
        (message) => (
          <div
            key={
              message._id
            }
            ref={(el) =>
              (messageRefs.current[
                message._id
              ] = el)
            }
            className={`message ${
              swipingId ===
              message._id
                ? "swiping"
                : ""
            } ${
              String(
                message.sender
              ) ===
              String(
                user._id
              )
                ? "sent"
                : "received"
            }`}
            style={{
              transform:
                swipingId ===
                message._id
                  ? `translateX(${swipeDistance}px)`
                  : "translateX(0)",
            }}
            onTouchStart={
              handleTouchStart
            }
            onTouchMove={(e) =>
              handleTouchMove(
                e,
                message
              )
            }
            onTouchEnd={(e) =>
              handleTouchEnd(
                e,
                message
              )
            }
          >
            {swipingId ===
              message._id && (
              <div
                className="swipe-arrow"
                style={{
                  opacity:
                    swipeDistance /
                    60,
                  transform: `translateY(-50%)
                    scale(${
                      0.8 +
                      swipeDistance /
                        100
                    })`,
                }}
              >
                ↰
              </div>
            )}

            <button
              className="reply-btn"
              onClick={() =>
                setReplyMessage(
                  message
                )
              }
            >
              <MdReply />
            </button>

            {message.replyTo && (
              <div
                className="reply-preview"
                onClick={() =>
                  scrollToMessage(
                    message.replyTo
                      ?._id
                  )
                }
              >
                <div className="reply-author">
                  {String(
                    message.replyTo
                      ?.sender
                  ) ===
                  String(
                    user._id
                  )
                    ? "You"
                    : selectedUser?.name}
                </div>

                <div className="reply-preview-text">
                  {
                    message
                      .replyTo
                      ?.text
                  }
                </div>
              </div>
            )}

            <div>
              {message.text}
            </div>

            <small className="message-time">
              {new Date(
                message.createdAt
              ).toLocaleTimeString(
                [],
                {
                  hour:
                    "2-digit",
                  minute:
                    "2-digit",
                }
              )}{" "}
              {getStatusIcon(
                message
              )}
            </small>
          </div>
        )
      )}

      <div
        ref={
          messagesEndRef
        }
      />
    </div>
  );
}
