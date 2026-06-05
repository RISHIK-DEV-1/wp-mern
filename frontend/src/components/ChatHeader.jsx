import React from "react";

import "./ChatHeader.css";

export default function ChatHeader({
  selectedUser,
  setSelectedUser,
  typing,
  onlineUsers,
}) {
  const isOnline =
    onlineUsers.includes(
      selectedUser?._id
    );

  return (
    <div className="chat-header">
      <button
        className="back-btn"
        onClick={() =>
          setSelectedUser?.(null)
        }
      >
        ←
      </button>

      <div className="header-avatar">
        {selectedUser?.name
          ?.charAt(0)
          .toUpperCase()}
      </div>

      <div className="chat-header-info">
        <h4>
          {selectedUser?.name}
        </h4>

        <p
          className={
            typing ? "typing" : ""
          }
        >
          {typing
            ? "typing"
            : isOnline
            ? "Online"
            : "Offline"}
        </p>
      </div>
    </div>
  );
}
