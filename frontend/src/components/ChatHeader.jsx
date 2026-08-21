import React, {
  useState,
} from "react";

import "./ChatHeader.css";

import {
  MdDelete,
  MdOutlineStarBorder,
  MdStar,
} from "react-icons/md";
import {
  FiChevronRight,
  FiChevronLeft,
} from "react-icons/fi";
import { LuForward } from "react-icons/lu";

export default function ChatHeader({
  selectedUser,
  setSelectedUser,
  typing,
  onlineUsers,
  lastSeen,
  selectedMessages,
  setSelectedMessages,
  setShowDeletePopup,
  openForwardScreen,
  handleToggleStar,
  starIconFilled,
  isContact,
}) {
  const [showFullEmail, setShowFullEmail] =
    useState(false);

  const isOnline = onlineUsers.includes(
    String(selectedUser?._id)
  );

  const formatLastSeen = (date) => {
    if (!date) return "Offline";

    return `Last seen ${new Date(
      date
    ).toLocaleString([], {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  const selectionMode =
    selectedMessages?.length > 0;

  const email =
    selectedUser?.email || "";

  /*
   * Maximum email length shown in the header
   * before the expand arrow appears.
   */
  const MAX_EMAIL_LENGTH = 20;

  const isLongEmail =
    email.length > MAX_EMAIL_LENGTH;

  const displayedEmail =
  isLongEmail && !showFullEmail
    ? `${email.slice(0, MAX_EMAIL_LENGTH)}...`
    : email;

  /*
   * Reset expanded email whenever chat changes.
   */
  React.useEffect(() => {
    setShowFullEmail(false);
  }, [selectedUser?._id]);

  return (
    <div className="chat-header">
      <button
        className="back-btn"
        onClick={() => {
          if (selectionMode) {
            setSelectedMessages([]);
            return;
          }

          setSelectedUser(null);

          localStorage.removeItem(
            "selectedChat"
          );
        }}
      >
        ←
      </button>

      {selectionMode ? (
        <>
          <div className="selection-count">
            {selectedMessages.length} selected
          </div>

          <div className="header-actions">
            <button
              className="header-action-btn"
              onClick={handleToggleStar}
            >
              {starIconFilled ? (
                <MdStar />
              ) : (
                <MdOutlineStarBorder />
              )}
            </button>

            <button
              className="header-action-btn"
              onClick={() =>
                setShowDeletePopup(true)
              }
            >
              <MdDelete />
            </button>

            <button
              className="header-action-btn"
              onClick={openForwardScreen}
            >
              <LuForward />
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="header-avatar">
            {selectedUser?.avatar ? (
              <img
                src={selectedUser.avatar}
                alt=""
                className="header-avatar-img"
              />
            ) : (
              selectedUser?.name
                ?.charAt(0)
                .toUpperCase()
            )}
          </div>

          <div className="chat-header-info">
          
            {isContact ? (
              <h4>
                {selectedUser?.name}
              </h4>
            ) : (
              <div className="chat-header-email">
                <span
                  className={
                    isLongEmail &&
                    !showFullEmail
                      ? "chat-header-email-text truncated"
                      : "chat-header-email-text"
                  }
                >
                  {displayedEmail}
                </span>

                {isLongEmail && (
                  <button
                    type="button"
                    className="email-expand-btn"
                    onClick={() =>
                      setShowFullEmail(
                        (prev) => !prev
                      )
                    }
                    aria-label={
                      showFullEmail
                        ? "Collapse email"
                        : "Show full email"
                    }
                  >
                    {showFullEmail ? (
  <FiChevronLeft />
) : (
  <FiChevronRight />
)}
                  </button>
                )}
              </div>
            )}

            <p
              className={
                typing ? "typing" : ""
              }
            >
              {typing
                ? "typing"
                : isOnline
                ? "Online"
                : formatLastSeen(
                    lastSeen
                  )}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
