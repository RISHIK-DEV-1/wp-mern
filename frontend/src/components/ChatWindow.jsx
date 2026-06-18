import React, {
  useState,
  useEffect,
  useContext,
  useCallback,
} from "react";

import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";

import socket from "../utils/socket";
import { AuthContext } from "../context/AuthContext";

import "./ChatWindow.css";

export default function ChatWindow({
  selectedUser,
  setSelectedUser,
  typingUser,
  onlineUsers,
}) {
  const { user } = useContext(AuthContext);

  const [messages, setMessages] = useState([]);
  const [replyMessage, setReplyMessage] = useState(null);

  /* ================= ADD MESSAGE (LOCAL SEND) ================= */

  const handleNewMessage = useCallback((message) => {
    setMessages((prev) => {
      const exists = prev.some((m) => m._id === message._id);
      return exists ? prev : [...prev, message];
    });
  }, []);

  /* ================= SOCKET: GLOBAL MESSAGE SYNC ================= */

  useEffect(() => {
    if (!user?._id) return;

    const handleReceiveMessage = (message) => {
      const senderId = String(message.sender);
      const receiverId = String(message.receiver);

      const selectedId = String(selectedUser?._id);

      // only inject messages relevant to current chat
      if (
        selectedId &&
        (senderId === selectedId || receiverId === selectedId)
      ) {
        setMessages((prev) => {
          const exists = prev.some((m) => m._id === message._id);

          if (exists) {
            return prev.map((m) =>
              m._id === message._id ? message : m
            );
          }

          return [...prev, message];
        });
      }
    };

    const handleReactionUpdate = (message) => {
      const selectedId = String(selectedUser?._id);

      if (!selectedId) return;

      if (
        String(message.sender) === selectedId ||
        String(message.receiver) === selectedId
      ) {
        setMessages((prev) =>
          prev.map((m) =>
            m._id === message._id ? message : m
          )
        );
      }
    };

    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("messageStatusUpdated", handleReceiveMessage);

    // NEW: reactions support
    socket.on("messageReactionUpdated", handleReactionUpdate);

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("messageStatusUpdated", handleReceiveMessage);
      socket.off("messageReactionUpdated", handleReactionUpdate);
    };
  }, [selectedUser, user]);

  /* ================= RESET CHAT ON USER CHANGE ================= */

  useEffect(() => {
    setMessages([]);
    setReplyMessage(null);
  }, [selectedUser?._id]);

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
            typing={typingUser === selectedUser?._id}
            onlineUsers={onlineUsers}
            lastSeen={selectedUser?.lastSeen}
          />

          <MessageList
            selectedUser={selectedUser}
            messages={messages}
            setMessages={setMessages}
            setReplyMessage={setReplyMessage}
          />

          <MessageInput
            selectedUser={selectedUser}
            onMessageSent={handleNewMessage}
            replyMessage={replyMessage}
            setReplyMessage={setReplyMessage}
          />
        </>
      )}
    </div>
  );
}
