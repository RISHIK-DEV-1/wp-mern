import React, {
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";

import {
  MdArrowBack,
  MdDone,
  MdDoneAll,
  MdBlock,
  MdStar,
  MdDelete,
} from "react-icons/md";

import { useNavigate } from "react-router-dom";

import API from "../utils/axios";
import { AuthContext } from "../context/AuthContext";

import "./Starred.css";

export default function Starred() {
  const navigate = useNavigate();

  const { user } = useContext(AuthContext);

  const [messages, setMessages] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pressedMessageId, setPressedMessageId] =
  useState(null);
  const [selectedMessages, setSelectedMessages] =
    useState([]);

  const longPressTimer = useRef(null);

  useEffect(() => {
  fetchStarredMessages();
  fetchContacts();
}, []);

  const fetchStarredMessages = async () => {
    try {
      const { data } = await API.get(
        `/messages/starred/${user._id}`
      );

      setMessages(data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

 const fetchContacts = async () => {
  if (!user?._id) return;

  try {
    const { data } = await API.get(
      `/contacts/${user._id}`
    );

    setContacts(
      Array.isArray(data) ? data : []
    );
  } catch (error) {
    console.error(
      "Fetch Contacts Error:",
      error
    );

    setContacts([]);
  }
};
const isContact = (userId) => {
  return contacts.some(
    (contact) =>
      String(contact._id) ===
      String(userId)
  );
};
  const toggleSelection = (id) => {
    setSelectedMessages((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id);
      }

      return [...prev, id];
    });
  };

  const handleLongPress = (message) => {
    longPressTimer.current = setTimeout(() => {
      setSelectedMessages((prev) => {
        if (prev.includes(message._id)) return prev;

        return [...prev, message._id];
      });
    }, 280);
  };

  const cancelLongPress = () => {
    clearTimeout(longPressTimer.current);
  };

  const formatHeaderDate = (date) => {
    return new Date(date).toLocaleDateString(
      "en-GB",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString(
      [],
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  const getStatusIcon = (message) => {
    if (
      String(message.sender._id) !==
      String(user._id)
    )
      return null;

    switch (message.status) {
      case "sent":
        return (
          <MdDone className="msg-status-icon" />
        );

      case "delivered":
        return (
          <MdDoneAll className="msg-status-icon" />
        );

      case "read":
        return (
          <MdDoneAll className="msg-status-icon read" />
        );

      default:
        return (
          <MdDone className="msg-status-icon" />
        );
    }
  };

  const unstarSelected = async () => {
    try {
      await Promise.all(
        selectedMessages.map((id) =>
          API.post(`/messages/star/${id}`, {
            userId: user._id,
          })
        )
      );

      setMessages((prev) =>
        prev.filter(
          (m) =>
            !selectedMessages.includes(m._id)
        )
      );

      setSelectedMessages([]);
    } catch (err) {
      console.log(err);
    }
  };

  if (loading) {
    return (
      <div className="starred-screen">
        <div className="starred-loading">
          Loading...
        </div>
      </div>
    );
  }

  if (!messages.length) {
    return (
      <div className="starred-screen">

        <div className="starred-header">

          <button
            className="starred-back"
            onClick={() => navigate(-1)}
          >
            <MdArrowBack />
          </button>

          <h3>Starred messages</h3>

        </div>

        <div className="starred-empty">
          No starred messages
        </div>

      </div>
    );
  }

  return (
    <div className="starred-screen">

      {selectedMessages.length === 0 ? (

        <div className="starred-header">

          <button
            className="starred-back"
            onClick={() => navigate(-1)}
          >
            <MdArrowBack />
          </button>

          <h3>Starred messages</h3>

        </div>

      ) : (

        <div className="starred-header selection">

          <button
            className="starred-back"
            onClick={() =>
              setSelectedMessages([])
            }
          >
            <MdArrowBack />
          </button>

          <span>
            {selectedMessages.length}
          </span>

          <div className="selection-actions">

            <button
              onClick={unstarSelected}
            >
              <MdStar />
            </button>

            <button>
              <MdDelete />
            </button>

          </div>

        </div>

      )}

      <div className="starred-list">
          {messages.map((message) => {
          const isMine =
            String(message.sender._id) ===
            String(user._id);

          const selected =
            selectedMessages.includes(
              message._id
            );

          return (
            <div
              key={message._id}
              className="starred-item"
            >
              {/* Conversation Header */}

              <div
                className="starred-conversation"
              >
                <div className="starred-avatar">
                  {message.sender.avatar ? (
                    <img
                      src={message.sender.avatar}
                      alt=""
                    />
                  ) : (
                    message.sender.name
                      .charAt(0)
                      .toUpperCase()
                  )}
                </div>

                <div className="starred-info">
                  <div className="starred-users">
                    <span>
                      {message.sender.name}
                    </span>

                    <span className="arrow">
                      {" > "}
                    </span>

                    <span>
                      {message.receiver.name}
                    </span>
                  </div>
                </div>

                <small>
                  {formatHeaderDate(
                    message.createdAt
                  )}
                </small>
              </div>

              {/* Message */}

              <div
                className={`message-row received-row
${
  selected
    ? "message-row-active"
    : ""
}
${
  pressedMessageId === message._id
    ? "pressed-highlight"
    : ""
}`}
                onClick={() => {
  if (selectedMessages.length > 0) {
    toggleSelection(message._id);
    return;
  }

  setPressedMessageId(message._id);

  const otherUser =
    isMine ? message.receiver : message.sender;
  const selectedChatUser = {
  ...otherUser,
  isContact: isContact(otherUser._id),
};

  localStorage.setItem(
    "selectedChat",
    JSON.stringify(selectedChatUser)
  );

  setTimeout(() => {
    navigate("/chat", {
     replace: true,
      state: {
        jumpToMessageId: message._id,
      },
    });
  }, 170);
}}
                onTouchStart={() =>
                  handleLongPress(message)
                }
                onTouchEnd={
                  cancelLongPress
                }
                onTouchCancel={
                  cancelLongPress
                }
              >
                <div
                  className={`message ${
                    isMine
                      ? "sent"
                      : "received"
                  }`}
                >
                  {/* Reply Preview */}

                  {message.replyTo &&
                    !message.deletedForEveryone && (
                      <div className="reply-preview">

                        <div className="reply-author">
                          {String(
                            message.replyTo
                              ?.sender
                          ) ===
                          String(
                            user._id
                          )
                            ? "You"
                            : message
                                .sender
                                .name}
                        </div>

                        <div className="reply-preview-text">
                          {
                            message
                              .replyTo
                              ?.text
                          }
                        </div>

                      </div>
                    )}

                  {/* Forwarded */}

                  {message.forwarded && (
                    <div className="forwarded-label">
                      Forwarded
                    </div>
                  )}

                  {/* Message */}

                  <div
                    className={`message-content ${
                      message.deletedForEveryone
                        ? "deleted-message"
                        : ""
                    }`}
                  >
                    {message.deletedForEveryone ? (
                      <>
                        <MdBlock className="deleted-icon" />

                        {isMine
                          ? "You deleted this message"
                          : "This message was deleted"}
                      </>
                    ) : (
                      message.text
                    )}
                  </div>

                  {/* Time */}

                  <span className="message-time">

                    <MdStar className="starred-icon" />

                    {formatTime(
                      message.createdAt
                    )}

                    {getStatusIcon(
                      message
                    )}

                  </span>

                </div>

              </div>

            </div>
          );
        })}

      </div>

    </div>
  );
}
