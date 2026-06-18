import React, {
  useEffect,
  useContext,
  useRef,
  useState,
} from "react";

import {
  MdReply,
  MdAddReaction,
} from "react-icons/md";

import EmojiPicker from "emoji-picker-react";

import API from "../utils/axios";
import socket from "../utils/socket";

import { AuthContext } from "../context/AuthContext";

import "./MessageList.css";

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

export default function MessageList({
  selectedUser,
  messages,
  setMessages,
  setReplyMessage,
}) {
  const { user } = useContext(AuthContext);

  const messagesEndRef = useRef(null);
  const messageRefs = useRef({});

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const longPressTimer = useRef(null);

  const [swipingId, setSwipingId] = useState(null);
  const [swipeDistance, setSwipeDistance] = useState(0);

  const [reactionTarget, setReactionTarget] = useState(null);
  const [pickerTarget, setPickerTarget] = useState(null);
  const [selectedMessageId, setSelectedMessageId] =
  useState(null);
  /* ================= FETCH ================= */

  const fetchMessages = async () => {
    if (!selectedUser) return;

    try {
      const { data } = await API.get(
        `/messages/${user._id}/${selectedUser._id}`
      );

      setMessages(data);
    } catch (error) {
      console.error("Failed to fetch messages:", error.message);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [selectedUser]);

  /* ================= SOCKET ================= */

  useEffect(() => {
    const handleUpdate = (message) => {
      const senderId = String(message.sender);
      const receiverId = String(message.receiver);
      const selectedId = String(selectedUser?._id);

      if (senderId === selectedId || receiverId === selectedId) {
        setMessages((prev) => {
          const exists = prev.some((m) => m._id === message._id);

          if (exists) {
            return prev.map((m) =>
              m._id === message._id ? message : m
            );
          }

          return [...prev, message];
        });
      }
    };

    socket.on("receiveMessage", handleUpdate);
    socket.on("messageStatusUpdated", handleUpdate);
    socket.on("messageReactionUpdated", handleUpdate);

    return () => {
      socket.off("receiveMessage", handleUpdate);
      socket.off("messageStatusUpdated", handleUpdate);
      socket.off("messageReactionUpdated", handleUpdate);
    };
  }, [selectedUser, setMessages]);

  /* ================= MARK READ ================= */

  useEffect(() => {
    if (!selectedUser) return;

    messages.forEach((message) => {
      const isIncoming =
        String(message.sender) === String(selectedUser._id);

      if (isIncoming && message.status !== "read") {
        socket.emit("markRead", message._id);
      }
    });
  }, [messages, selectedUser]);

  /* ================= AUTO SCROLL ================= */

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);
  /*===== EMOJI PICKER LOCK SCROLL ====== */
  useEffect(() => {
  if (pickerTarget) {
    document.body.style.overflow =
      "hidden";
  } else {
    document.body.style.overflow =
      "";
  }

  return () => {
    document.body.style.overflow =
      "";
  };
}, [pickerTarget]);
  /* ================= STATUS ICON ================= */

  const getStatusIcon = (message) => {
    if (String(message.sender) !== String(user._id)) return null;

    switch (message.status) {
      case "sending":
        return "⏰";
      case "sent":
        return "✓";
      case "delivered":
        return "✓✓";
      case "read":
        return <span style={{ color: "#53bdeb" }}>✓✓</span>;
      default:
        return "✓";
    }
  };

  /* ================= REPLY JUMP ================= */

  const scrollToMessage = (messageId) => {
    const element = messageRefs.current[messageId];
    if (!element) return;

    element.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    element.classList.add("highlight-message");

    setTimeout(() => {
      element.classList.remove("highlight-message");
    }, 2000);
  };

  /* ================= REACTIONS ================= */

  const sendReaction = async (messageId, emoji) => {
    socket.emit("reactMessage", {
      messageId,
      userId: user._id,
      emoji,
    });

    setReactionTarget(null);
    setPickerTarget(null);
  };

  const renderReactions = (message) => {
    if (!message.reactions?.length) return null;

    const grouped = {};

    message.reactions.forEach((r) => {
      grouped[r.emoji] = (grouped[r.emoji] || 0) + 1;
    });

    return (
      <div className="reaction-row">
        {Object.entries(grouped).map(([emoji, count]) => (
          <span key={emoji} className="reaction-chip">
            {emoji} {count > 1 ? count : ""}
          </span>
        ))}
      </div>
    );
  };

  /* ================= SWIPE ================= */

  const handleTouchStart = (
  e,
  message
) => {
    touchStartX.current = e.changedTouches[0].clientX;

    longPressTimer.current = setTimeout(() => {
  setReactionTarget(message._id);

  setSelectedMessageId(
    message._id
  );
}, 280);
  };

  const handleTouchMove = (e, message) => {
    clearTimeout(longPressTimer.current);

    const distance = e.changedTouches[0].clientX - touchStartX.current;

    if (distance > 0) {
      setSwipingId(message._id);
      setSwipeDistance(Math.min(distance, 80));
    }
  };

  const handleTouchEnd = (e, message) => {
    clearTimeout(longPressTimer.current);

    touchEndX.current = e.changedTouches[0].clientX;

    const distance = touchEndX.current - touchStartX.current;

    if (distance > 60) {
      setReplyMessage(message);
    }

    setSwipingId(null);
    setSwipeDistance(0);
  };

  return (
    <div className="messages">
      {messages.map((message) => (
  <div
    key={message._id}
    className={`message-row ${
      String(message.sender) ===
      String(user._id)
        ? "sent-row"
        : "received-row"
    
  } ${
    reactionTarget === message._id
      ? "message-row-active"
      : ""
  }`}
  onClick={() => {
    if (
      reactionTarget ===
      message._id
    ) {
      setReactionTarget(null);
      setPickerTarget(null);
      setSelectedMessageId(null);
  }
  }}
    onTouchStart={(e) =>
      handleTouchStart(
        e,
        message
      )
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
    onContextMenu={(e) =>
      e.preventDefault()
    }
  >
    <div
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
        String(message.sender) ===
        String(user._id)
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
      onMouseLeave={() =>
        setReactionTarget(null)
      }
    >
            
          {/* SWIPE ARROW */}
          {swipingId === message._id && (
            <div
              className="swipe-arrow"
              style={{
                opacity: swipeDistance / 60,
              }}
            >
              ↰
            </div>
          )}

          {/* REPLY BUTTON */}
          <button
            className="reply-btn"
            onClick={() => setReplyMessage(message)}
          >
            <MdReply />
          </button>

          {/* MESSAGE TEXT */}
          <div className="message-content">
  {message.text}
</div>

          {/* REACTIONS */}
          {renderReactions(message)}

          {/* TIME */}
          <small className="message-time">
            {new Date(message.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}{" "}
            {getStatusIcon(message)}
          </small>

          {/* QUICK REACTION BAR */}
          {reactionTarget ===
  message._id && (
            <div className="reaction-bar">
              {QUICK_REACTIONS.map((emoji) => (
                <span
                  key={emoji}
                  onClick={() => sendReaction(message._id, emoji)}
                >
                  {emoji}
                </span>
              ))}

              <span
                className="plus-btn"
                onClick={(e) => {
    e.stopPropagation();

    setPickerTarget(message._id);
  }}
              >
                <MdAddReaction />
              </span>
            </div>
          )}
  
</div>
</div>
))}
{pickerTarget && (
  <>
    <div
      className="emoji-picker-backdrop"
      onClick={() => {
        setPickerTarget(null);
        setReactionTarget(null);
        setSelectedMessageId(null);
      }}
    />

    <div
      className="emoji-picker-wrapper"
      onClick={(e) =>
        e.stopPropagation()
      }
    >
      <EmojiPicker theme="dark"
        autoFocusSearch={false}
        height={320}
        width="100%"
        lazyLoadEmojis
        onEmojiClick={(data) =>
          sendReaction(
            pickerTarget,
            data.emoji
          )
        }
      />
    </div>
  </>
)}
<div ref={messagesEndRef} />
</div>
);
}
