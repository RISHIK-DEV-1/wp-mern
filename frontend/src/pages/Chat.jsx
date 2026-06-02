import React, {
  useState,
  useEffect,
} from "react";

import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";

import "./Chat.css";

export default function Chat() {
  const [
    selectedUser,
    setSelectedUser,
  ] = useState(null);

  const [
    isMobile,
    setIsMobile,
  ] = useState(
    window.innerWidth <= 700
  );

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

  if (isMobile) {
    return (
      <div className="chat-container">
        {selectedUser ? (
          <ChatWindow
            selectedUser={
              selectedUser
            }
            setSelectedUser={
              setSelectedUser
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
          />
        )}
      </div>
    );
  }

  return (
    <div className="chat-container">
      <Sidebar
        selectedUser={
          selectedUser
        }
        setSelectedUser={
          setSelectedUser
        }
      />

      <ChatWindow
        selectedUser={
          selectedUser
        }
        setSelectedUser={
          setSelectedUser
        }
      />
    </div>
  );
}
