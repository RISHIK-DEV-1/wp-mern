import React, {
  useEffect,
  useState,
  useContext,
} from "react";

import {
  useNavigate,
  useLocation,
} from "react-router-dom";

import API from "../utils/axios";

import { AuthContext } from "../context/AuthContext";

import { MdArrowBack } from "react-icons/md";
import { MdSend } from "react-icons/md";
import { FiSearch } from "react-icons/fi";
import { MdDone } from "react-icons/md";
import "./ForwardScreen.css";

export default function ForwardScreen() {
  const navigate = useNavigate();

  const { state } = useLocation();

  const { user } =
    useContext(AuthContext);

  const messageIds =
    state?.messageIds || [];

  const [search, setSearch] =
    useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [chats, setChats] =
    useState([]);
  const [contacts, setContacts] = useState([]);
  const [selectedChats, setSelectedChats] =
    useState([]);
  const [showSending, setShowSending] =
  useState(false);
  const [loading, setLoading] =
  useState(true);
  useEffect(() => {
    const fetchChats = async () => {
  try {
    setLoading(true);

    const { data } =
      await API.get(
        `/messages/chats/${user._id}`
      );

    setChats(data);
  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }
};

    fetchChats();
  }, [user]);

 useEffect(() => {
  if (!user?._id) return;

  const fetchContacts = async () => {
    try {
      const { data } = await API.get(
        `/contacts/${user._id}`
      );

      setContacts(
        Array.isArray(data) ? data : []
      );
    } catch (err) {
      console.error("Fetch Contacts Error:", err);
      setContacts([]);
    }
  };

  fetchContacts();
}, [user?._id]);

const getContact = (userId) => {
  return contacts.find(
    (contact) =>
      String(contact._id) ===
      String(userId)
  );
};

const getDisplayName = (chatUser) => {
  if (!chatUser) return "";

  const contact = getContact(chatUser._id);

  if (contact) {
    return (
      contact.contactName?.trim() ||
      chatUser.email ||
      ""
    );
  }

  return chatUser.email || "";
};
  const filteredChats =
  chats.filter((chat) =>
    getDisplayName(chat.user)
      .toLowerCase()
      .includes(
        search.toLowerCase()
      )
  );

  const toggleChat = (id) => {
    if (
      selectedChats.includes(id)
    ) {
      setSelectedChats((prev) =>
        prev.filter(
          (x) => x !== id
        )
      );

      return;
    }

    if (
      selectedChats.length >= 5
    ) {
      return;
    }

    setSelectedChats((prev) => [
      ...prev,
      id,
    ]);
  };

  const handleForward = async () => {
  if (selectedChats.length === 0) return;

  if (selectedChats.length > 1) {
    sessionStorage.setItem(
      "showSendingToast",
      "true"
    );
  }

  try {
    await Promise.all(
      selectedChats.map((receiverId) =>
        API.post("/messages/forward", {
          sender: user._id,
          receiver: receiverId,
          messageIds,
        })
      )
    );

    if (selectedChats.length === 1) {
      const chat = chats.find(
        (c) =>
          String(c.user._id) ===
          String(selectedChats[0])
      );

      if (chat) {
        localStorage.setItem(
          "selectedChat",
          JSON.stringify(chat.user)
        );
      }

      navigate("/chat", {
        replace: true,
      });
    } else {
      navigate(-1);
    }
  } catch (err) {
    console.error(
      "Forward failed:",
      err
    );
  }
};

 return (
  <div className="forward-screen">

    {/* Header */}
    <div className="forward-header">

      <button
        className="forward-back-btn"
        onClick={() => {
          if (showSearch) {
            setShowSearch(false);
            return;
          }
          navigate(-1);
        }}
      >
        <MdArrowBack />
      </button>

      {!showSearch ? (
        <>
          <div className="forward-header-info">
            <h3>Forward to...</h3>
            <small>
              {selectedChats.length}/5 selected
            </small>
          </div>

          <button
            className="forward-search-icon"
            onClick={() => setShowSearch(true)}
          >
            <FiSearch />
          </button>
        </>
      ) : (
        <div className="forward-search-animated">
          <input
            autoFocus
            type="text"
            placeholder="Search chats..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

        </div>
      )}

    </div>

    {/* Chat List */}
<div className="forward-chat-list">

  {loading ? (
    <div className="forward-loading">
      <span className="forward-spinner" />
    </div>
  ) : (
    filteredChats.map((chat) => {
      const displayName =
        getDisplayName(chat.user);

      const selected =
        selectedChats.includes(chat.user._id);

      return (
        <div
          key={chat.user._id}
          className={`forward-chat ${
            selected ? "selected" : ""
          }`}
          onClick={() =>
            toggleChat(chat.user._id)
          }
        >

          <div className="forward-avatar">
            {chat.user.avatar ? (
              <img
                src={chat.user.avatar}
                alt=""
              />
            ) : (
              displayName
                ?.charAt(0)
                .toUpperCase()
            )}
          </div>

          <div className="forward-name">
            {displayName}
          </div>

          <div className="forward-check">
            {selected && <MdDone />}
          </div>

        </div>
      );
    })
  )}

</div>

    {/* Floating Send */}
    {selectedChats.length > 0 && (
      <button
        className="forward-send-btn"
        onClick={handleForward}
      >
        <MdSend />
      </button>
    )}

    {/* Sending Overlay */}
    {showSending && (
      <div className="sending-overlay">
        <div className="sending-box">
          Sending messages...
        </div>
      </div>
    )}

  </div>
);
}
