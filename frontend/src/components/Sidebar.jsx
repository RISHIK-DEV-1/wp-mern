import React, {
  useEffect,
  useState,
  useContext,
} from "react";

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
  const { user } = useContext(AuthContext);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [unreadCounts, setUnreadCounts] =
    useState({});

  /* ================= FETCH USERS ================= */

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await API.get(
          "/auth/users"
        );

        const filtered = data.filter(
          (u) => u._id !== user._id
        );

        setUsers(filtered);
      } catch (error) {
        console.error(
          "Failed to fetch users:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [user]);

  /* ================= FETCH UNREAD COUNTS ================= */

  const fetchUnreadCounts = async () => {
    try {
      const { data } = await API.get(
        `/messages/unread/${user._id}`
      );

      setUnreadCounts(data);
    } catch (error) {
      console.error(
        "Failed to fetch unread counts:",
        error
      );
    }
  };

  useEffect(() => {
    if (user?._id) {
      fetchUnreadCounts();
    }
  }, [user]);

  /* ================= REAL-TIME UPDATE ================= */

  useEffect(() => {
    const handleUnreadUpdate = () => {
      fetchUnreadCounts();
    };

    socket.on(
      "unreadCountUpdated",
      handleUnreadUpdate
    );

    return () => {
      socket.off(
        "unreadCountUpdated",
        handleUnreadUpdate
      );
    };
  }, [user]);

  return (
    <div className="sidebar">
      <h3>Chats</h3>

      {loading ? (
        <div className="sidebar-message">
          Loading users...
        </div>
      ) : users.length === 0 ? (
        <div className="sidebar-message">
          No users found
        </div>
      ) : (
        users.map((u) => {
          const isOnline =
            onlineUsers.includes(u._id);

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

                  {unreadCounts[u._id] >
                    0 && (
                    <span className="unread-count">
                      {
                        unreadCounts[
                          u._id
                        ]
                      }
                    </span>
                  )}
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
                    : isOnline
                    ? "Online"
                    : u.lastSeen
                    ? (() => {
                        const lastSeen =
                          new Date(
                            u.lastSeen
                          );

                        const now =
                          new Date();

                        const isToday =
                          lastSeen.toDateString() ===
                          now.toDateString();

                        const yesterday =
                          new Date();

                        yesterday.setDate(
                          yesterday.getDate() -
                            1
                        );

                        const isYesterday =
                          lastSeen.toDateString() ===
                          yesterday.toDateString();

                        const time =
                          lastSeen.toLocaleTimeString(
                            "en-US",
                            {
                              hour:
                                "numeric",
                              minute:
                                "2-digit",
                              hour12: true,
                            }
                          );

                        if (
                          isToday
                        ) {
                          return `Last seen today at ${time}`;
                        }

                        if (
                          isYesterday
                        ) {
                          return `Last seen yesterday at ${time}`;
                        }

                        return `Last seen ${lastSeen.toLocaleDateString(
                          "en-GB",
                          {
                            day: "numeric",
                            month:
                              "short",
                          }
                        )} at ${time}`;
                      })()
                    : "Offline"}
                </p>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
