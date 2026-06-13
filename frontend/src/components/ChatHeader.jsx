import React from "react";
import "./ChatHeader.css";

export default function ChatHeader({
  selectedUser,
  setSelectedUser,
  typing,
  onlineUsers,
  lastSeen,
}) {
  const isOnline = onlineUsers.includes(
    String(selectedUser?._id)
  );

  const formatLastSeen = (date) => {
    if (!date) return "Offline";

    return `Last seen ${new Date(
      date
    ).toLocaleString([], {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  return (
    <div className="chat-header">
      <button
        className="back-btn"
        onClick={() => setSelectedUser?.(null)}
      >
        ←
      </button>

      <div className="header-avatar">
  {selectedUser?.avatar ? (
    <img
      src={
        selectedUser.avatar
      }
      alt=""
      className="header-avatar-img"
    />
  ) : (
    selectedUser?.name
      ?.charAt(0)
      .toUpperCase()
  )}
</div>

      <div className="chat-header-info">
        <h4>{selectedUser?.name}</h4>

        <p className={typing ? "typing" : ""}>
          {typing
            ? "typing"
            : isOnline
            ? "Online"
            : formatLastSeen(lastSeen)}
        </p>
      </div>
    </div>
  );
}
