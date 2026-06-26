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
import API from "../utils/axios";
import "./ChatWindow.css";

export default function ChatWindow({
  selectedUser,
  setSelectedUser,
  typingUser,
  onlineUsers,
}) {
  const { user } = useContext(AuthContext);
  const [selectedMessages, setSelectedMessages] =
  useState([]);
  const [messages, setMessages] = useState([]);
  const [replyMessage, setReplyMessage] = useState(null);
  const [showDeletePopup, setShowDeletePopup] =
  useState(false);

  const selectedMessageObjects =
  messages.filter((m) =>
    selectedMessages.includes(m._id)
  );

const canDeleteForEveryone =
  selectedMessageObjects.length > 0 &&
  selectedMessageObjects.every((m) => {
    const isMine =
      String(m.sender) ===
      String(user._id);

    const withinWindow =
      Date.now() -
        new Date(
          m.createdAt
        ).getTime() <
      48 * 60 * 60 * 1000;

    return (
      isMine &&
      withinWindow &&
      !m.deletedForEveryone
    );
  });
  /* ================= ADD MESSAGE (LOCAL SEND) ================= */

  const handleNewMessage = useCallback((message) => {
    setMessages((prev) => {
      const exists = prev.some((m) => m._id === message._id);
      return exists ? prev : [...prev, message];
    });
  }, []);
 
  /*DELETE FOR ME */
  const handleDeleteForMe =
  async () => {
    try {
      await Promise.all(
        selectedMessages.map((id) =>
          API.post(
            `/messages/delete-for-me/${id}`,
            {
              userId: user._id,
            }
          )
        )
      );

      setMessages((prev) =>
        prev.filter(
          (m) =>
            !selectedMessages.includes(
              m._id
            )
        )
      );

      setSelectedMessages([]);
      setShowDeletePopup(false);
    } catch (error) {
      console.error(error);
    }
  };

  /*DELETE FOR EVERYONE */
  const handleDeleteForEveryone =
  async () => {
    try {
      const responses =
        await Promise.all(
          selectedMessages.map((id) =>
            API.post(
              `/messages/delete-for-everyone/${id}`,
              {
                userId: user._id,
              }
            )
          )
        );

      const updatedMessages =
        responses.map(
          (r) => r.data
        );

      setMessages((prev) =>
        prev.map((m) => {
          const updated =
            updatedMessages.find(
              (u) =>
                u._id === m._id
            );

          return updated || m;
        })
      );

      setSelectedMessages([]);
      setShowDeletePopup(false);
    } catch (error) {
      console.error(error);
    }
  };
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
            selectedMessages={selectedMessages}
            setSelectedMessages={setSelectedMessages}
            setShowDeletePopup={setShowDeletePopup}
          />

          <MessageList
            selectedUser={selectedUser}
            messages={messages}
            setMessages={setMessages}
            setReplyMessage={setReplyMessage}
            selectedMessages={selectedMessages}
            setSelectedMessages={setSelectedMessages}
          />

          <MessageInput
            selectedUser={selectedUser}
            onMessageSent={handleNewMessage}
            replyMessage={replyMessage}
            setReplyMessage={setReplyMessage}
          />
          
          {showDeletePopup && (
  <>
    <div
      className="emoji-picker-backdrop"
      onClick={() => {
  setShowDeletePopup(false);
  setSelectedMessages([]);
}}
    />

    <div className="delete-popup">
      <h4>
        Delete
        {" "}
        {selectedMessages.length}
        {" "}
        message(s)?
      </h4>

      <div
  className={`popup-actions ${
    canDeleteForEveryone
      ? "three-actions"
      : "two-actions"
  }`}
>
  {canDeleteForEveryone ? (
    <>
      <button
        className="popup-btn delete-all-btn"
        onClick={handleDeleteForEveryone}
      >
        Delete for everyone
      </button>

      <button
        className="popup-btn delete-me-btn"
        onClick={handleDeleteForMe}
      >
        Delete for me
      </button>

      <button
        className="popup-btn cancel-btn"
        onClick={() => {
          setShowDeletePopup(false);
          setSelectedMessages([]);
        }}
      >
        Cancel
      </button>
    </>
  ) : (
    <>
      <button
        className="popup-btn cancel-btn"
        onClick={() => {
          setShowDeletePopup(false);
          setSelectedMessages([]);
        }}
      >
        Cancel
      </button>

      <button
        className="popup-btn delete-me-btn"
        onClick={handleDeleteForMe}
      >
        Delete for me
      </button>
    </>
  )}
</div>
    </div>
  </>
)}
        </>
      )}
    </div>
  );
}
