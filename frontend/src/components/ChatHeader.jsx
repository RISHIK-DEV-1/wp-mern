import React from "react";

export default function ChatHeader({
  selectedUser,
}) {
  return (
    <div className="chat-header">
      {selectedUser ? (
        <h4>
          {selectedUser.name}
        </h4>
      ) : (
        <h4>
          Select a chat
        </h4>
      )}
    </div>
  );
}
