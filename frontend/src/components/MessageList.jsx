import React from "react";

import "./MessageList.css";

export default function MessageList() {
  return (
    <div className="messages">
      <div className="message received">
        Hello 👋
      </div>

      <div className="message sent">
        Hi there!
      </div>
    </div>
  );
}
