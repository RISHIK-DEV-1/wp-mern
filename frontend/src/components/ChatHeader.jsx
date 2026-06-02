import React from "react";
import "./ChatHeader.css";

export default function ChatHeader({
  selectedUser,
  setSelectedUser,
}) {
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

      <div className="chat-header-info">
        <h4>
          {selectedUser?.name}
        </h4>

        <p>
          {selectedUser?.email}
        </p>
      </div>
    </div>
  );
}
