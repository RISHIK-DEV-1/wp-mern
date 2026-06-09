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
  const [messages, setMessages] = useState([]);

  /* ================= ADD NEW MESSAGE ================= */

  const handleNewMessage = (message) => {
    setMessages((prev) => {
      const exists = prev.some(
        (m) => m._id === message._id
      );

      return exists ? prev : [...prev, message];
    });
  };

  return (
    <div className="chat-window">
      {!selectedUser ? (
        <div className="welcome-screen">
          <h1>WhatsApp MERN</h1>
          <p>Select a chat to start messaging</p>
        </div>
      ) : (
        <>
          <ChatHeader
            selectedUser={selectedUser}
            setSelectedUser={setSelectedUser}
            typing={
              typingUser ===
              selectedUser?._id
            }
            onlineUsers={onlineUsers}
            lastSeen={selectedUser?.lastSeen}
          />

          <MessageList
            selectedUser={selectedUser}
            messages={messages}
            setMessages={setMessages}
          />

          <MessageInput
            selectedUser={selectedUser}
            onMessageSent={
              handleNewMessage
            }
          />
        </>
      )}
    </div>
  );
}
