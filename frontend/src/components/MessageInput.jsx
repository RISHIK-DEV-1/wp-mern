import React from "react";

import "./MessageInput.css";

export default function MessageInput() {
  return (
    <div className="message-input">
      <input
        type="text"
        placeholder="Type a message..."
      />

      <button>Send</button>
    </div>
  );
}
