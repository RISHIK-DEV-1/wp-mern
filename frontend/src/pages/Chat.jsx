import { useLocation } from "react-router-dom";
import React, {
  useState,
  useEffect,
  useContext,
  useRef,
} from "react";

import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";

import { AuthContext } from "../context/AuthContext";

import socket from "../utils/socket";

import "./Chat.css";

export default function Chat() {
  const { user } =
    useContext(AuthContext);
  const location = useLocation();
  
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
  const [showSendingToast, setShowSendingToast] =
  useState(false);
  const historyPushed = useRef(false);

  
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

  useEffect(() => {
  const shouldShow =
    sessionStorage.getItem(
      "showSendingToast"
    );

  if (!shouldShow) return;

  sessionStorage.removeItem(
    "showSendingToast"
  );

  setShowSendingToast(true);

  const timer = setTimeout(() => {
    setShowSendingToast(false);
  }, 1500);

  return () => clearTimeout(timer);
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

  /* ================= MOBILE HISTORY ================= */

useEffect(() => {
  if (!isMobile) return;

  if (selectedUser && !historyPushed.current) {
    window.history.pushState(
      { chatOpen: true },
      ""
    );

    historyPushed.current = true;
  }

  if (!selectedUser) {
    historyPushed.current = false;
  }
}, [selectedUser, isMobile]);
  /* ================= MOBILE BACK BUTTON ================= */

useEffect(() => {
  const handlePopState = () => {
  if (isMobile && selectedUser) {
    setSelectedUser(null);

    localStorage.removeItem("selectedChat");

    historyPushed.current = false;
  }
};

  window.addEventListener(
    "popstate",
    handlePopState
  );

  return () => {
    window.removeEventListener(
      "popstate",
      handlePopState
    );
  };
}, [isMobile, selectedUser]);
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
  <>
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
           jumpToMessageId={location.state?.jumpToMessageId}
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

    {showSendingToast && (
  <div className="chat-sending-toast">
    Sending messages...
  </div>
)}
  </>
);
  }

  /* ================= DESKTOP VIEW ================= */

  return (
  <>
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
        jumpToMessageId={location.state?.jumpToMessageId}
      />
        </div>

    {showSendingToast && (
      <div className="chat-sending-toast">
        Sending messages...
      </div>
    )}
  </>
);
}
