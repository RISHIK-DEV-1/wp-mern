import React, { useState } from "react";

import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";

import "./ChatWindow.css";

export default function ChatWindow({
  selectedUser,
  setSelectedUser,
  typingUser,
  onlineUsers,
}) {
  const [newMessage, setNewMessage] =
    useState(null);

  /* ================= EMPTY STATE ================= */

  if (!selectedUser) {
    return (
      <div className="welcome-screen">
        <h1>WhatsApp MERN</h1>

        <p>
          Select a chat to start
          messaging
        </p>
      </div>
    );
  }

  return (
    <div className="chat-window">
      <ChatHeader
        selectedUser={selectedUser}
        setSelectedUser={setSelectedUser}
        typing={
          typingUser ===
          selectedUser?._id
        }
        onlineUsers={onlineUsers}
      />

      <MessageList
        selectedUser={selectedUser}
        newMessage={newMessage}
      />

      <MessageInput
        selectedUser={selectedUser}
        onMessageSent={setNewMessage}
      />
    </div>
  );
}
