import React, {
  useEffect,
  useState,
  useContext,
} from "react";
import {
  useNavigate,
} from "react-router-dom";

import { FiMoreVertical } from "react-icons/fi";
import { MdBlock } from "react-icons/md";
import {
  FiSearch,
  FiPlus,
} from "react-icons/fi";

import API from "../utils/axios";
import socket from "../utils/socket";

import { AuthContext } from "../context/AuthContext";

import "./Sidebar.css";

export default function Sidebar({
  selectedUser,
  setSelectedUser,
  onlineUsers,
  typingUser,
}) {
  const {
    user,
    logoutUser,
  } = useContext(AuthContext);

  const navigate = useNavigate();

  const [showMenu, setShowMenu] =
    useState(false);

  const [chats, setChats] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [unreadCounts, setUnreadCounts] =
    useState({});

  const [searchTerm, setSearchTerm] =
    useState("");

  const [contacts, setContacts] =
    useState([]);

  /* ================= FETCH CHATS ================= */

  const fetchChats = async () => {
    if (!user?._id) return;

    try {
      const { data } = await API.get(
        `/messages/chats/${user._id}`
      );

      setChats(
        Array.isArray(data) ? data : []
      );
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
  }, [user?._id]);

  /* ================= FETCH CONTACTS ================= */

  const fetchContacts = async () => {
    if (!user?._id) return;

    try {
      const { data } = await API.get(
        `/contacts/${user._id}`
      );

      setContacts(
        Array.isArray(data) ? data : []
      );
    } catch (error) {
      console.error(
        "Fetch Contacts Error:",
        error
      );

      setContacts([]);
    }
  };

  useEffect(() => {
    if (user?._id) {
      fetchContacts();
    }
  }, [user?._id]);

  /* ================= CONTACT CHECK ================= */

  const getContact = (userId) => {
    return contacts.find(
      (contact) =>
        String(contact._id) ===
        String(userId)
    );
  };

  const isContact = (userId) => {
    return Boolean(
      getContact(userId)
    );
  };

  /* ================= DISPLAY NAME ================= */

  const getDisplayName = (chatUser) => {
    if (!chatUser) return "";

    const contact =
      getContact(chatUser._id);

    if (contact) {
      return (
        contact.contactName?.trim() ||
        chatUser.email ||
        ""
      );
    }

    return chatUser.email || "";
  };

  /* ================= PREPARE SELECTED USER ================= */

  const prepareSelectedUser = (
    chatUser
  ) => {
    if (!chatUser) return chatUser;

    const contact =
      getContact(chatUser._id);

    return {
      ...chatUser,

      contactName:
        contact?.contactName?.trim() ||
        "",
    };
  };

  /* ================= FETCH UNREAD COUNTS ================= */

  const fetchUnreadCounts = async () => {
    if (!user?._id) return;

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
  }, [user?._id]);

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
    if (!user?._id) return;

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
  }, [user?._id]);

  /* ================= FORMAT TIME ================= */

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

  /* ================= FILTER CHATS ================= */

  const filteredChats =
    chats.filter((chat) => {
      const displayName =
        getDisplayName(chat.user)
          .toLowerCase();

      const email =
        chat.user?.email?.toLowerCase() ||
        "";

      const search =
        searchTerm.toLowerCase();

      return (
        displayName.includes(search) ||
        email.includes(search)
      );
    });

  return (
    <div className="sidebar">

      {/* ================= HEADER ================= */}

      <div className="sidebar-header">

        <h3>Chats</h3>

        <div className="menu-wrapper">

          <button
            className="menu-btn"
            onClick={() =>
              setShowMenu(
                (prev) => !prev
              )
            }
          >
            <FiMoreVertical />
          </button>

          {showMenu && (
            <div className="dropdown-menu">

              <button
                onClick={() => {
                  setShowMenu(false);
                  navigate("/profile");
                }}
              >
                Profile
              </button>

              <button
                onClick={() => {
                  setShowMenu(false);
                  navigate("/starred");
                }}
              >
                Starred messages
              </button>

              <button
                onClick={() => {
                  socket.disconnect();
                  logoutUser();
                  window.location.replace(
                    "/login"
                  );
                }}
              >
                Logout
              </button>

            </div>
          )}

        </div>

      </div>

      {/* ================= SEARCH ================= */}

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
  <div className="sidebar-loading">
    <span className="sidebar-spinner" />
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

          const displayName =
            getDisplayName(u);

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
              onClick={() => {

                const preparedUser =
                  prepareSelectedUser(u);

                setSelectedUser(
                  preparedUser
                );

                localStorage.setItem(
                  "selectedChat",
                  JSON.stringify(
                    preparedUser
                  )
                );

                setUnreadCounts(
                  (prev) => ({
                    ...prev,
                    [u._id]: 0,
                  })
                );
              }}
            >

              {/* ================= AVATAR ================= */}

              <div className="avatar-wrapper">

                <div className="avatar">

                  {u.avatar ? (
                    <img
                      src={u.avatar}
                      alt=""
                      className="avatar-img"
                    />
                  ) : (
                    displayName
                      ?.charAt(0)
                      .toUpperCase()
                  )}

                </div>

                <span
                  className={`status-dot ${
                    isOnline
                      ? "online"
                      : "offline"
                  }`}
                />

              </div>

              {/* ================= CHAT INFO ================= */}

              <div className="chat-info">

                <div className="chat-grid">

                  <h4>
                    {displayName}
                  </h4>

                  <small
                    className={
                      unreadCounts[
                        u._id
                      ] > 0
                        ? "chat-time unread"
                        : "chat-time"
                    }
                  >
                    {formatTime(
                      chat.lastMessageTime
                    )}
                  </small>

                  <p
                    className={`sidebar-status ${
                      isTyping
                        ? "typing"
                        : ""
                    }`}
                  >

                    {isTyping ? (

                      "typing..."

                    ) : chat.lastMessage ===
                        "This message was deleted" ||
                      chat.lastMessage ===
                        "You deleted this message" ? (

                      <>
                        <MdBlock className="sidebar-deleted-icon" />
                        {chat.lastMessage}
                      </>

                    ) : String(
                        chat.lastSender
                      ) === String(
                        user._id
                      ) ? (

                      `You: ${chat.lastMessage}`

                    ) : (

                      chat.lastMessage

                    )}

                  </p>

                  {unreadCounts[
                    u._id
                  ] > 0 ? (

                    <span className="unread-count">
                      {
                        unreadCounts[
                          u._id
                        ]
                      }
                    </span>

                  ) : (

                    <span></span>

                  )}

                </div>

              </div>

            </div>
          );
        })
      )}

      {/* ================= FLOATING BUTTON ================= */}

      <button
        className="new-chat-btn"
        onClick={() =>
          navigate("/new-chat")
        }
        aria-label="New chat"
      >
        <FiPlus />
      </button>

    </div>
  );
}
