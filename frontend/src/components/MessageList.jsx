import { useLocation, useNavigate } from "react-router-dom";
import React, {
  useEffect,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import {
  MdReply,
  MdAddReaction,
  MdDone,
  MdDoneAll,
  MdBlock,
} from "react-icons/md";

import EmojiPicker from "emoji-picker-react";
import { MdStar } from "react-icons/md";
import API from "../utils/axios";
import socket from "../utils/socket";
import { MdKeyboardDoubleArrowDown } from "react-icons/md";
import { AuthContext } from "../context/AuthContext";

import "./MessageList.css";

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

export default function MessageList({
  selectedUser,
  messages,
  setMessages,
  setReplyMessage,
  selectedMessages,
  setSelectedMessages,
  animatedStarIds,
  jumpToMessageId,
}) {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
const location = useLocation();

const hasJumped = useRef(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

const isInitialLoad = useRef(true);


const [showScrollButton, setShowScrollButton] =
  useState(false);
  const [floatingDate, setFloatingDate] =
  useState("");

const [showFloatingDate, setShowFloatingDate] =
  useState(false);

const floatingDateTimer = useRef(null);
  const messageRefs = useRef({});
  const [unreadCount, setUnreadCount] =
  useState(0);
const [loading, setLoading] = useState(false);
const [firstUnreadMessageId, setFirstUnreadMessageId] =
  useState(null);

const unreadDividerRef = useRef(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchEndX = useRef(0);
  const longPressTimer = useRef(null);

  const [swipingId, setSwipingId] = useState(null);
  const [swipeDistance, setSwipeDistance] = useState(0);
  const [pickerTarget, setPickerTarget] = useState(null);
  const [selectedMessageId, setSelectedMessageId] =
  useState(null);

  const toggleMessageSelection = (
  messageId
) => {
  setSelectedMessages((prev) => {
    if (prev.includes(messageId)) {
      return prev.filter(
        (id) => id !== messageId
      );
    }

    return [...prev, messageId];
  });
};
  /* ================= FETCH ================= */

  const fetchMessages = async () => {
  if (!selectedUser) return;

  setLoading(true);

  try {
    const { data } = await API.get(
      `/messages/${user._id}/${selectedUser._id}`
    );

    setMessages(data.messages);

    setUnreadCount(data.unreadCount);

    setFirstUnreadMessageId(
      data.firstUnreadMessageId
    );
  } catch (error) {
    console.error(
      "Failed to fetch messages:",
      error.message
    );
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchMessages();
  }, [selectedUser]);
  useEffect(() => {
  if (selectedMessages.length !== 1) {
    setSelectedMessageId(null);
    setPickerTarget(null);
  }
}, [selectedMessages]);
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

  /* ================= MARK CONVERSATION READ ================= */

useEffect(() => {
  if (!selectedUser) return;

  const markConversationRead = async () => {
    try {
      await API.put(
        "/messages/read-conversation",
        {
          senderId: selectedUser._id,
          receiverId: user._id,
        }
      );

      setMessages((prev) =>
        prev.map((msg) =>
          String(msg.sender) ===
          String(selectedUser._id)
            ? {
                ...msg,
                status: "read",
              }
            : msg
        )
      );

      socket.emit(
        "conversationRead",
        {
          senderId: selectedUser._id,
          receiverId: user._id,
        }
      );
    } catch (err) {
      console.log(err);
    }
  };

  markConversationRead();
}, [selectedUser]);

  /* ================= AUTO SCROLL ================= */
   useEffect(() => {
  isInitialLoad.current = true;
}, [selectedUser]);

   useEffect(() => {
  const container =
    messagesContainerRef.current;

  if (!container) return;

  const handleScroll = () => {
  const distance =
    container.scrollHeight -
    container.scrollTop -
    container.clientHeight;

  setShowScrollButton(distance > 80);

  // Show floating date while scrolling
  setShowFloatingDate(true);

  clearTimeout(floatingDateTimer.current);

  floatingDateTimer.current = setTimeout(() => {
    setShowFloatingDate(false);
  }, 700);

  // Find first visible date
  const separators =
    container.querySelectorAll(".date-separator");

  for (const separator of separators) {
    const rect =
      separator.getBoundingClientRect();

    const containerRect =
      container.getBoundingClientRect();

    if (rect.top >= containerRect.top - 5) {
      setFloatingDate(
        separator.dataset.date
      );
      break;
    }
  }
};

  container.addEventListener(
    "scroll",
    handleScroll
  );

  return () => {
  container.removeEventListener(
    "scroll",
    handleScroll
  );

};
}, [selectedUser]);

   useLayoutEffect(() => {
  const container = messagesContainerRef.current;

  if (!container) return;

  // Don't auto-scroll if we're jumping from Starred
  if (
    jumpToMessageId &&
    isInitialLoad.current
  ) {
    isInitialLoad.current = false;
    return;
  }

  if (
    isInitialLoad.current &&
    messages.length > 0
  ) {
  isInitialLoad.current = false;

  requestAnimationFrame(() => {

    if (
  unreadCount > 0 &&
  firstUnreadMessageId
) {
  const firstUnreadIndex =
    messages.findIndex(
      (m) =>
        m._id ===
        firstUnreadMessageId
    );

  const targetIndex =
    Math.max(
      firstUnreadIndex - 3,
      0
    );

  const targetMessage =
    messages[targetIndex];

  if (
    targetMessage &&
    messageRefs.current[
      targetMessage._id
    ]
  ) {
    messageRefs.current[
      targetMessage._id
    ].scrollIntoView({
      block: "start",
    });
  }
} else {
  container.scrollTop =
    container.scrollHeight;
}

  });

  return;
}

  // Only auto jump if already near bottom
  const distanceFromBottom =
    container.scrollHeight -
    container.scrollTop -
    container.clientHeight;

  if (distanceFromBottom < 120) {
    container.scrollTop =
      container.scrollHeight;
  }
}, [messages]);

useEffect(() => {
  if (!jumpToMessageId) return;

  const tryJump = () => {
    const row =
      messageRefs.current[jumpToMessageId]
        ?.closest(".message-row");

    if (!row) {
      requestAnimationFrame(tryJump);
      return;
    }

    row.scrollIntoView({
  block: "center",
  behavior: "auto",
});

row.classList.add("highlight-message");

setTimeout(() => {
  row.classList.remove("highlight-message");

  navigate(location.pathname, {
    replace: true,
    state: {},
  });
}, 2000);
  };

  tryJump();
}, [jumpToMessageId, messages]);
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
      return (
        <span className="msg-status-icon">
          ⏰
        </span>
      );

    case "sent":
      return (
        <MdDone className="msg-status-icon" />
      );

    case "delivered":
      return (
        <MdDoneAll className="msg-status-icon" />
      );

    case "read":
      return (
        <MdDoneAll
          className="msg-status-icon read"
        />
      );

    default:
      return (
        <MdDone className="msg-status-icon" />
      );
  }
};

  /* ================= REPLY JUMP ================= */

  const scrollToMessage = (messageId) => {
  const targetMessage = messages.find(
    (m) => m._id === messageId
  );

  if (
    !targetMessage ||
    targetMessage.deletedForEveryone
  ) {
    return;
  }

  const bubble = messageRefs.current[messageId];

if (!bubble) return;

const row = bubble.closest(".message-row");

if (!row) return;

row.scrollIntoView({
  behavior: "auto",
  block: "center",
});

row.classList.add("highlight-message");

setTimeout(() => {
  row.classList.remove("highlight-message");
}, 2000);
};

  /* ================= REACTIONS ================= */

  const sendReaction = async (messageId, emoji) => {
    socket.emit("reactMessage", {
      messageId,
      userId: user._id,
      emoji,
    });

    setSelectedMessageId(null);
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
    touchStartY.current =
  e.changedTouches[0].clientY;

    longPressTimer.current = setTimeout(() => {
  setSelectedMessages((prev) => {
    if (prev.includes(message._id)) {
      return prev;
    }

    return [...prev, message._id];
  });

  setSelectedMessageId(message._id);
}, 280);
  };

  const handleTouchMove = (e, message) => {
    clearTimeout(longPressTimer.current);

    const distance = e.changedTouches[0].clientX - touchStartX.current;

    if (distance > 0) {
      setSwipingId(message._id);
      setSwipeDistance(Math.min(distance, 100));
    }
  };

  const handleTouchEnd = (e, message) => {
    clearTimeout(longPressTimer.current);

    touchEndX.current = e.changedTouches[0].clientX;

    const deltaX =
  touchEndX.current -
  touchStartX.current;

const deltaY = Math.abs(
  e.changedTouches[0].clientY -
  touchStartY.current
);

if (
  deltaX > 95 &&
  deltaY < 30 &&
   !message.deletedForEveryone
) {
  setReplyMessage(message);
}

    setSwipingId(null);
    setSwipeDistance(0);
  };
  const getDateLabel = (date) => {
  const msgDate = new Date(date);

  const today = new Date();
  const yesterday = new Date();

  yesterday.setDate(today.getDate() - 1);

  const isToday =
    msgDate.toDateString() ===
    today.toDateString();

  const isYesterday =
    msgDate.toDateString() ===
    yesterday.toDateString();

  if (isToday) return "Today";

  if (isYesterday) return "Yesterday";

  return msgDate.toLocaleDateString([], {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};
  const jumpToBottom = () => {
  const container =
    messagesContainerRef.current;

  if (!container) return;

  container.scrollTop =
    container.scrollHeight;
};
  return (
    <div
  className="messages"
  ref={messagesContainerRef}
>
{loading && (
  <div className="message-list-loading">
    <div className="message-loading-spinner"></div>
  </div>
)}
   <div
  className={`floating-date-pill ${
    showFloatingDate ? "show" : ""
  }`}
>
  {floatingDate}
</div>

      {messages.map((message, index) => {
  const previousMessage =
    messages[index - 1];

  const showUnreadDivider =
  unreadCount > 0 &&
  message._id ===
    firstUnreadMessageId;
  const showDateSeparator =
    !previousMessage ||
    new Date(
      previousMessage.createdAt
    ).toDateString() !==
      new Date(
        message.createdAt
      ).toDateString();


  return (
    <React.Fragment
      key={message._id}
    >
{showUnreadDivider && (
  <div
    ref={unreadDividerRef}
    className="unread-separator"
  >
    <span>
      {unreadCount} unread message
      {unreadCount > 1 ? "s" : ""}
    </span>
  </div>
)}

{showDateSeparator && (
  <div
  className="date-separator"
  data-date={getDateLabel(
    message.createdAt
  )}
>
    <span>
      {getDateLabel(
        message.createdAt
      )}
    </span>
  </div>
)}
  <div
    className={`message-row ${
      String(message.sender) ===
      String(user._id)
        ? "sent-row"
        : "received-row"

  } ${
      selectedMessages.includes(message._id)
      ? "message-row-active"
      : ""
  }`}
  onClick={() => {
  if (selectedMessages.length > 0) {
    toggleMessageSelection(
      message._id
    );
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
        setSelectedMessageId(null)
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
          {/* REPLY PREVIEW */}
{message.replyTo && !message.deletedForEveryone && (
  <div
    className="reply-preview"
    onClick={() =>
      scrollToMessage(
        message.replyTo?._id
      )
    }
  >
    <div className="reply-author">
      {String(
        message.replyTo?.sender
      ) === String(user._id)
        ? "You"
        : selectedUser?.name}
    </div>

    <div className="reply-preview-text">
      {message.replyTo?.deletedForEveryone
        ? "Deleted message"
        : message.replyTo?.text}
    </div>
  </div>
)}
          {/* MESSAGE TEXT */}
          <div
  className={`message-content ${
    message.deletedForEveryone
      ? "deleted-message"
      : ""
  }`}
>
  {message.deletedForEveryone ? (
    <>
      <MdBlock className="deleted-icon" />
      {String(message.sender) ===
      String(user._id)
        ? "You deleted this message"
        : "This message was deleted"}
    </>
  ) : (
    message.text
  )}
</div>

          {/* REACTIONS */}
          {renderReactions(message)}

          {/* TIME */}
          <span className="message-time">
  {message.starredBy?.includes(user._id) && (
    <span className="star-wrapper">
      <MdStar className="starred-icon" />

      {animatedStarIds?.includes(message._id) && (
        <MdStar className="star-fly" />
      )}
    </span>
  )}

  {new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}

  {getStatusIcon(message)}
</span>
          {/* QUICK REACTION BAR */}
{selectedMessageId === message._id &&
 !message.deletedForEveryone && (
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
</React.Fragment>
);
})}
{pickerTarget && (
  <>
    <div
      className="emoji-picker-backdrop"
      onClick={() => {
        setPickerTarget(null);
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
  {showScrollButton && (
  <button
    className="scroll-bottom-btn"
    onClick={jumpToBottom}
  >
    <MdKeyboardDoubleArrowDown />
  </button>
)}
<div ref={messagesEndRef} />
</div>
);
}
