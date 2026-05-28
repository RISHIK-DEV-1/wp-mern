import React from "react";

import ChatHeader from "./ChatHeader";

import MessageList from "./MessageList";

import MessageInput from "./MessageInput";

export default function ChatWindow({
  selectedUser,
}) {
  return (
    <div className="chat-window">
      <ChatHeader
        selectedUser={
          selectedUser
        }
      />

      <MessageList />

      <MessageInput />
    </div>
  );
}
