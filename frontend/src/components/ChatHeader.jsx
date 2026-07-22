import React from "react";
import "./ChatHeader.css";
import { MdDelete,MdOutlineStarBorder,MdStar, } from "react-icons/md";
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
}) {
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

  {/* DELETE FIRST (IMPORTANT) */}
  <button
    className="header-action-btn"
    onClick={() => setShowDeletePopup(true)}
  >
    <MdDelete />
  </button>

  {/* FORWARD SECOND */}
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
    <h4>{selectedUser?.name}</h4>

    <p className={typing ? "typing" : ""}>
      {typing
        ? "typing"
        : isOnline
        ? "Online"
        : formatLastSeen(lastSeen)}
    </p>
  </div>
  </>
)}
    </div>
  );
}
