import React, {
  useEffect,
  useState,
  useContext,
} from "react";

import API from "../utils/axios";

import { AuthContext } from "../context/AuthContext";

import "./Sidebar.css";

export default function Sidebar({
  selectedUser,
  setSelectedUser,
  onlineUsers,
  typingUser,
}) {
  const { user } =
    useContext(AuthContext);

  const [users, setUsers] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    const fetchUsers =
      async () => {
        try {
          const { data } =
            await API.get(
              "/auth/users"
            );

          const filtered =
            data.filter(
              (u) =>
                u._id !==
                user._id
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
            onlineUsers.includes(
              u._id
            );

          const isTyping =
            typingUser === u._id;

          return (
            <div
              key={u._id}
              className={`sidebar-chat ${
                selectedUser?._id ===
                u._id
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
                <h4>{u.name}</h4>

                <p
                  className={`sidebar-status ${
                    isTyping
                      ? "typing"
                      : ""
                  }`}
                >
                  isTyping
  ? "typing..."
  : isOnline
  ? "Online"
  : u.lastSeen
  ? `Last seen ${new Date(
      u.lastSeen
    ).toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    })}`
  : "Offline"
                </p>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
