import React from "react";

import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";

import "./ChatWindow.css";

export default function ChatWindow({
  selectedUser,
  setSelectedUser,
}) {
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
        selectedUser={
          selectedUser
        }
        setSelectedUser={
          setSelectedUser
        }
      />

      <MessageList />

      <MessageInput />
    </div>
  );
}
