import React, {
  useState,
  useEffect,
  useContext,
} from "react";

import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";

import { AuthContext } from "../context/AuthContext";

import socket from "../utils/socket";

import "./Chat.css";

export default function Chat() {
  const { user } =
    useContext(AuthContext);

  const [selectedUser, setSelectedUser] =
    useState(null);

  const [isMobile, setIsMobile] =
    useState(
      window.innerWidth <= 700
    );

  const [typingUser, setTypingUser] =
    useState(null);

  const [onlineUsers, setOnlineUsers] =
    useState([]);

  /* ================= RESTORE OPEN CHAT ================= */

  useEffect(() => {
    const savedChat =
      localStorage.getItem(
        "selectedChat"
      );

    if (savedChat) {
      setSelectedUser(
        JSON.parse(savedChat)
      );
    }
  }, []);

  /* ================= SAVE OPEN CHAT ================= */

  useEffect(() => {
    if (selectedUser) {
      localStorage.setItem(
        "selectedChat",
        JSON.stringify(selectedUser)
      );
    } else {
      localStorage.removeItem(
        "selectedChat"
      );
    }
  }, [selectedUser]);

  /* ================= RESPONSIVE ================= */

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(
        window.innerWidth <= 700
      );
    };

    window.addEventListener(
      "resize",
      handleResize
    );

    return () =>
      window.removeEventListener(
        "resize",
        handleResize
      );
  }, []);

  /* ================= SOCKET JOIN ================= */

  useEffect(() => {
    if (!user?._id) return;

    const joinUser = () => {
      socket.emit(
        "join",
        user._id
      );
    };

    if (socket.connected) {
      joinUser();
    }

    socket.on(
      "connect",
      joinUser
    );

    return () => {
      socket.off(
        "connect",
        joinUser
      );
    };
  }, [user]);

  /* ================= SOCKET EVENTS ================= */

  useEffect(() => {
    const handleOnlineUsers = (
      users
    ) => {
      setOnlineUsers(users);
    };

    const handleTyping = ({
      sender,
    }) => {
      setTypingUser(sender);
    };

    const handleStopTyping = ({
      sender,
    }) => {
      setTypingUser((prev) =>
        prev === sender
          ? null
          : prev
      );
    };

    socket.on(
      "onlineUsers",
      handleOnlineUsers
    );

    socket.on(
      "typing",
      handleTyping
    );

    socket.on(
      "stopTyping",
      handleStopTyping
    );

    return () => {
      socket.off(
        "onlineUsers",
        handleOnlineUsers
      );

      socket.off(
        "typing",
        handleTyping
      );

      socket.off(
        "stopTyping",
        handleStopTyping
      );
    };
  }, []);

  /* ================= MOBILE VIEW ================= */

  if (isMobile) {
    return (
      <div className="chat-container">
        {selectedUser ? (
          <ChatWindow
            selectedUser={selectedUser}
            setSelectedUser={
              setSelectedUser
            }
            typingUser={
              typingUser
            }
            onlineUsers={
              onlineUsers
            }
          />
        ) : (
          <Sidebar
            selectedUser={
              selectedUser
            }
            setSelectedUser={
              setSelectedUser
            }
            typingUser={
              typingUser
            }
            onlineUsers={
              onlineUsers
            }
          />
        )}
      </div>
    );
  }

  /* ================= DESKTOP VIEW ================= */

  return (
    <div className="chat-container">
      <Sidebar
        selectedUser={
          selectedUser
        }
        setSelectedUser={
          setSelectedUser
        }
        typingUser={
          typingUser
        }
        onlineUsers={
          onlineUsers
        }
      />

      <ChatWindow
        selectedUser={selectedUser}
        setSelectedUser={
          setSelectedUser
        }
        typingUser={
          typingUser
        }
        onlineUsers={
          onlineUsers
        }
      />
    </div>
  );
}
