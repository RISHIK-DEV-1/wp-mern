import React, {
  useEffect,
  useState,
  useContext,
} from "react";

import API from "../utils/axios";
import socket from "../utils/socket";

import { AuthContext } from "../context/AuthContext";

import NewChatModal from "./NewChatModal";
import { FiSearch } from "react-icons/fi";
import "./Sidebar.css";

export default function Sidebar({
  selectedUser,
  setSelectedUser,
  onlineUsers,
  typingUser,
}) {
  const { user } = useContext(AuthContext);

  const [chats, setChats] = useState([]);
  const [loading, setLoading] =
    useState(true);

  const [unreadCounts, setUnreadCounts] =
    useState({});

  const [showModal, setShowModal] =
    useState(false);
  const [searchTerm, setSearchTerm] =
  useState("");
  /* ================= FETCH CHATS ================= */

  const fetchChats = async () => {
    try {
      const { data } = await API.get(
        `/messages/chats/${user._id}`
      );

      setChats(data);
    } catch (error) {
      console.error(
        "Failed to fetch chats:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?._id) {
      fetchChats();
    }
  }, [user]);

  /* ================= FETCH UNREAD COUNTS ================= */

  const fetchUnreadCounts = async () => {
    try {
      const { data } = await API.get(
        `/messages/unread/${user._id}`
      );

      setUnreadCounts(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (user?._id) {
      fetchUnreadCounts();
    }
  }, [user]);

  /* ================= MOVE CHAT TO TOP ================= */

  const moveChatToTop = (
    userId,
    messageText,
    messageTime,
    senderId
  ) => {
    setChats((prev) => {
      const updated = [...prev];

      const index = updated.findIndex(
        (chat) =>
          String(chat.user._id) ===
          String(userId)
      );

      /* New conversation */
      if (index === -1) {
        fetchChats();
        return prev;
      }

      const chat = {
        ...updated[index],
        lastMessage: messageText,
        lastMessageTime: messageTime,
        lastSender: senderId,
      };

      updated.splice(index, 1);

      return [chat, ...updated];
    });
  };

  /* ================= REAL TIME ================= */

  useEffect(() => {
    const handleUnreadUpdate = () => {
      fetchUnreadCounts();
    };

    const handleReceiveMessage = (
      message
    ) => {
      fetchUnreadCounts();

      const otherUserId =
        String(message.sender) ===
        String(user._id)
          ? String(message.receiver)
          : String(message.sender);

      moveChatToTop(
        otherUserId,
        message.text,
        message.createdAt,
        message.sender
      );
    };

    socket.on(
      "unreadCountUpdated",
      handleUnreadUpdate
    );

    socket.on(
      "receiveMessage",
      handleReceiveMessage
    );

    return () => {
      socket.off(
        "unreadCountUpdated",
        handleUnreadUpdate
      );

      socket.off(
        "receiveMessage",
        handleReceiveMessage
      );
    };
  }, [user]);

  const formatTime = (date) => {
    if (!date) return "";

    const msgDate = new Date(date);
    const now = new Date();

    const isToday =
      msgDate.toDateString() ===
      now.toDateString();

    if (isToday) {
      return msgDate.toLocaleTimeString(
        "en-US",
        {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }
      );
    }

    return msgDate.toLocaleDateString(
      "en-GB",
      {
        day: "numeric",
        month: "short",
      }
    );
  };
  const filteredChats =
  chats.filter((chat) =>
    chat.user.name
      .toLowerCase()
      .includes(
        searchTerm.toLowerCase()
      )
  ); 
   
  return (
    <div className="sidebar">
      <h3>Chats</h3>
    <div className="search-container">
  <FiSearch className="search-icon" />

  <input
    type="text"
    placeholder="Search chats"
    value={searchTerm}
    onChange={(e) =>
      setSearchTerm(
        e.target.value
      )
    }
    className="search-input"
  />
</div>
      {/* ================= CHAT LIST ================= */}

      {loading ? (
  <div className="sidebar-message">
    Loading chats...
  </div>
) : chats.length === 0 ? (
  <div className="sidebar-message">
    No chats yet
  </div>
) : filteredChats.length === 0 ? (
  <div className="sidebar-message">
    No matching chats
  </div>
) : (
        filteredChats.map((chat) => {
          const u = chat.user;

          const isOnline =
            onlineUsers.includes(
              String(u._id)
            );

          const isTyping =
            typingUser === u._id;

          return (
            <div
              key={u._id}
              className={`sidebar-chat ${
                selectedUser?._id === u._id
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setSelectedUser(u)
              }
            >
              <div className="avatar-wrapper">
                <div className="avatar">
                  {u.name
                    ?.charAt(0)
                    .toUpperCase()}
                </div>

                <span
                  className={`status-dot ${
                    isOnline
                      ? "online"
                      : "offline"
                  }`}
                />
              </div>

              <div className="chat-info">
                <div className="chat-top">
                  <h4>{u.name}</h4>

                  <div
                    style={{
                      display: "flex",
                      alignItems:
                        "center",
                      gap: "8px",
                    }}
                  >
                    <small>
                      {formatTime(
                        chat.lastMessageTime
                      )}
                    </small>

                    {unreadCounts[u._id] >
                      0 && (
                      <span className="unread-count">
                        {unreadCounts[u._id]}
                      </span>
                    )}
                  </div>
                </div>

                <p
                  className={`sidebar-status ${
                    isTyping
                      ? "typing"
                      : ""
                  }`}
                >
                  {isTyping
                    ? "typing..."
                    : String(
                        chat.lastSender
                      ) ===
                      String(user._id)
                    ? `You: ${chat.lastMessage}`
                    : chat.lastMessage}
                </p>
              </div>
            </div>
          );
        })
      )}

      {/* ================= FLOATING BUTTON ================= */}

      <button
        className="new-chat-btn"
        onClick={() =>
          setShowModal(true)
        }
      >
        +
      </button>

      {/* ================= MODAL ================= */}

      <NewChatModal
        isOpen={showModal}
        onClose={() =>
          setShowModal(false)
        }
        setSelectedUser={
          setSelectedUser
        }
      />
    </div>
  );
}
