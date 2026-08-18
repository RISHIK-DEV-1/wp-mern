import React, {
  useContext,
  useEffect,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import API from "../utils/axios";
import { AuthContext } from "../context/AuthContext";

import "./NewChatModal.css";

export default function NewChatModal() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [users, setUsers] = useState([]);

  const [search, setSearch] = useState("");
  const [searchMode, setSearchMode] =
    useState(false);

  const [loading, setLoading] = useState(false);

const BackIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="modal-back-icon"
    aria-hidden="true"
  >
    <path
      d="M19 12H5M11 6L5 12L11 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
  /* ================= FETCH CONTACTS ================= */

  const fetchContacts = async () => {
    if (!user?._id) return;

    try {
      setLoading(true);

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
    } finally {
      setLoading(false);
    }
  };

  /* ================= GLOBAL SEARCH ================= */

  const searchUsers = async (searchText) => {
    if (!user?._id) return;

    try {
      setLoading(true);

      const { data } = await API.get(
        "/auth/users",
        {
          params: {
            search: searchText,
            userId: user._id,
          },
        }
      );

      setUsers(
        Array.isArray(data) ? data : []
      );
    } catch (error) {
      console.error(
        "Search Users Error:",
        error
      );

      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  /* ================= OPEN MODAL ================= */

  useEffect(() => {
  if (!user?._id) return;

  setSearch("");
  setUsers([]);
  setSearchMode(false);

  fetchContacts();
}, [user?._id]);

  /* ================= SEARCH ================= */

  useEffect(() => {
  if (!searchMode) return;

  const searchText = search.trim();

  if (!searchText) {
    setUsers([]);
    return;
  }

  const timer = setTimeout(() => {
    searchUsers(searchText);
  }, 300);

  return () => clearTimeout(timer);
}, [
  search,
  searchMode,
  user?._id,
]);

  /* ================= SEARCH OPEN ================= */

  const openSearch = () => {
    setSearchMode(true);
    setSearch("");
    setUsers([]);
  };

  /* ================= SEARCH CLOSE ================= */

  const closeSearch = () => {
    setSearchMode(false);
    setSearch("");
    setUsers([]);
  };

  /* ================= CONTACT CHECK ================= */

  const isContact = (userId) => {
    return contacts.some(
      (contact) =>
        String(contact._id) ===
        String(userId)
    );
  };

  /* ================= OPEN CHAT ================= */

  const openChat = (selectedUser) => {
  localStorage.setItem(
    "selectedChat",
    JSON.stringify(selectedUser)
  );

  navigate("/chat", {
    state: {
      selectedUser,
    },
  });
};

  const contactCount = contacts.length;

  const contactUsers = users.filter((item) =>
    isContact(item._id)
  );

  const nonContactUsers = users.filter(
    (item) => !isContact(item._id)
  );
/*highlight*/
const highlightText = (text, query) => {
  if (!text || !query?.trim()) {
    return text || "";
  }

  const escapedQuery = query.trim().replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );

  const regex = new RegExp(
    `(${escapedQuery})`,
    "gi"
  );

  return text.split(regex).map(
    (part, index) =>
      part.toLowerCase() ===
      query.trim().toLowerCase() ? (
        <span
          key={index}
          className="modal-search-match"
        >
          {part}
        </span>
      ) : (
        <React.Fragment key={index}>
          {part}
        </React.Fragment>
      )
  );
};
  return (
    <div
      className="modal-overlay">
      <div className="modal-container">
        {/* ================= HEADER ================= */}

        {!searchMode ? (
          <div className="modal-header">
            <button
              type="button"
              className="modal-icon-button"
              onClick={() => navigate("/chat")}
              aria-label="Close"
            >
             <BackIcon />
            </button>

            <div className="modal-title">
              <div>Select contact</div>

              <span>
                {contactCount}{" "}
                {contactCount === 1
                  ? "contact"
                  : "contacts"}
              </span>
            </div>

            <button
              type="button"
              className="modal-icon-button"
              onClick={openSearch}
              aria-label="Search"
            >
              <svg
                viewBox="0 0 24 24"
                className="modal-icon"
              >
                <circle
                  cx="11"
                  cy="11"
                  r="6.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                />

                <path
                  d="M16 16l5 5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        ) : (
          <div className="modal-search-header">
            <button
              type="button"
              className="modal-icon-button"
              onClick={closeSearch}
              aria-label="Back"
            >
              <BackIcon />
            </button>

            <input
              autoFocus
              className="modal-search-input"
              type="text"
              placeholder="Search users"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />
          </div>
        )}
 
{/* ================= NEW CONTACT ================= */}

<div
  className="modal-new-contact"
  onClick={() => {
    navigate("/new-contact");
  }}
>
  <div className="modal-new-contact-icon">
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        cx="10"
        cy="8"
        r="3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M4 19c0-3 2.5-5 6-5s6 2 6 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="M19 8v6M16 11h6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  </div>

  <span>NEW CONTACT</span>
</div>

        {/* ================= CONTENT ================= */}

        <div className="modal-users">
          {loading ? (
            <div className="modal-loading">
              <span className="modal-spinner" />
            </div>
          ) : !searchMode ? (
            contacts.length === 0 ? (
              <p className="modal-msg">
                No contacts yet
              </p>
            ) : (
              <>
                <div className="modal-section-title">
                  Contacts on WhatsApp
                </div>

                {contacts.map((contact) => (
                  <div
                    key={contact._id}
                    className="modal-user"
                    onClick={() =>
                      openChat(contact)
                    }
                  >
                    <div className="modal-avatar">
                      {contact.avatar ? (
                        <img
                          src={contact.avatar}
                          alt=""
                        />
                      ) : (
                        contact.name
                          ?.charAt(0)
                          .toUpperCase()
                      )}
                    </div>

                    <div className="modal-user-info">
                      <h4>
                        {contact.name}
                      </h4>

                      <p>
                        {contact.email}
                      </p>
                    </div>
                  </div>
                ))}
              </>
            )
          ) : !search.trim() ? (
            <p className="modal-msg">
              Search for a user
            </p>
          ) : users.length === 0 ? (
            <p className="modal-msg">
              No users found
            </p>
          ) : (
            <>
              {/* CONTACT SEARCH RESULTS */}

              {contactUsers.length > 0 && (
                <>
                  <div className="modal-section-title">
                    Contacts on WhatsApp
                  </div>

                  {contactUsers.map(
                    (searchedUser) => (
                      <div
                        key={searchedUser._id}
                        className="modal-user"
                        onClick={() =>
                          openChat(
                            searchedUser
                          )
                        }
                      >
                        <div className="modal-avatar">
                          {searchedUser.avatar ? (
                            <img
                              src={
                                searchedUser.avatar
                              }
                              alt=""
                            />
                          ) : (
                            searchedUser.name
                              ?.charAt(0)
                              .toUpperCase()
                          )}
                        </div>

                        <div className="modal-user-info">
                          <h4>
  {highlightText(
    searchedUser.name,
    search
  )}
</h4>

<p>
  {highlightText(
    searchedUser.email,
    search
  )}
</p>
                        </div>
                      </div>
                    )
                  )}
                </>
              )}

              {/* NON CONTACT SEARCH RESULTS */}

              {nonContactUsers.length > 0 && (
                <>
                  <div className="modal-section-title">
                    Not in your contacts
                  </div>

                  {nonContactUsers.map(
                    (searchedUser) => (
                      <div
                        key={searchedUser._id}
                        className="modal-user modal-user-noncontact"
                      >
                        <div className="modal-avatar">
                          {searchedUser.avatar ? (
                            <img
                              src={
                                searchedUser.avatar
                              }
                              alt=""
                            />
                          ) : (
                            searchedUser.name
                              ?.charAt(0)
                              .toUpperCase()
                          )}
                        </div>

                        <div className="modal-user-info">
                          <h4>
  {highlightText(
    searchedUser.name,
    search
  )}
</h4>

<p>
  {highlightText(
    searchedUser.email,
    search
  )}
</p>
                        </div>

                        <button
                          type="button"
                          className="modal-chat-button"
                          onClick={() =>
                            openChat(
                              searchedUser
                            )
                          }
                        >
                          Chat
                        </button>
                      </div>
                    )
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
