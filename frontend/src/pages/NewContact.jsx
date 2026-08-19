import React, {
  useContext,
  useEffect,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import API from "../utils/axios";
import { AuthContext } from "../context/AuthContext";

import "./NewContact.css";

/* ================= ICONS ================= */

const BackIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="new-contact-icon"
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

const SearchIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="new-contact-icon"
    aria-hidden="true"
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
);

/* ================= PAGE ================= */

export default function NewContact() {
  const navigate = useNavigate();

  const { user } = useContext(AuthContext);

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [searchMode, setSearchMode] = useState(false);
  const [selectedUser, setSelectedUser] =
    useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const showMessage = (text) => {
  setMessage(text);

  setTimeout(() => {
    setMessage("");
  }, 2500);
};

  /* ================= HIGHLIGHT SEARCH ================= */

  const highlightText = (text, query) => {
    if (!text || !query?.trim()) {
      return text || "";
    }

    const escapedQuery = query
      .trim()
      .replace(
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
            className="new-contact-search-match"
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
 
/* ================= SEARCH MODE ================= */

const openSearch = () => {
  setSearchMode(true);
  setSearch("");
  setUsers([]);
  setSelectedUser(null);
};

const closeSearch = () => {
  setSearchMode(false);
  setSearch("");
  setUsers([]);
  setSelectedUser(null);
};
  /* ================= SEARCH USERS ================= */

  useEffect(() => {
    if (!user?._id) return;

    const searchText = search.trim();

    if (!searchText) {
      setUsers([]);
      return;
    }

    const timer = setTimeout(async () => {
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
    }, 300);

    return () => clearTimeout(timer);
  }, [search, user?._id]);

  /* ================= SELECT USER ================= */

  const selectUser = (selected) => {
    setSelectedUser(selected);
  };

  /* ================= SAVE CONTACT ================= */

  const saveContact = async () => {
    if (
      !user?._id ||
      !selectedUser?._id
    ) {
      return;
    }

    try {
      setSaving(true);

      await API.post("/contacts", {
        userId: user._id,
        contactId: selectedUser._id,
      });

      /*
       * Contact successfully added.
       *
       * Return to Select Contact screen.
       */
      navigate("/new-chat", {
  replace: true,
});
    } catch (error) {
      console.error(
        "Add Contact Error:",
        error
      );

      showMessage(
  error.response?.data?.message ||
    "Failed to add contact"
);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="new-contact-page">
      {/* ================= HEADER ================= */}

      {!searchMode ? (
  <div className="new-contact-header">
    <button
      type="button"
      className="new-contact-icon-button"
      onClick={() => navigate(-1)}
      aria-label="Back"
    >
      <BackIcon />
    </button>

    <div className="new-contact-title">
      New contact
    </div>

    <button
      type="button"
      className="new-contact-icon-button"
      onClick={openSearch}
      aria-label="Search"
    >
      <SearchIcon />
    </button>
  </div>
) : (
  <div className="new-contact-search-header">
    <button
      type="button"
      className="new-contact-icon-button"
      onClick={closeSearch}
      aria-label="Back"
    >
      <BackIcon />
    </button>

    <input
      type="text"
      className="new-contact-search-input"
      placeholder="Search users"
      value={search}
      onChange={(e) =>
        setSearch(e.target.value)
      }
      autoFocus
    />
  </div>
)}


      {/* ================= CONTENT ================= */}

      <div className="new-contact-users">
        {loading ? (
          <div className="new-contact-loading">
            <span className="new-contact-spinner" />
          </div>
        ) : !search.trim() ? (
          <p className="new-contact-message">
            Search for a verified user
          </p>
        ) : users.length === 0 ? (
          <p className="new-contact-message">
            No users found
          </p>
        ) : (
          users.map((item) => {
            const isSelected =
              selectedUser?._id ===
              item._id;

            return (
              <div
                key={item._id}
                className={`new-contact-user ${
                  isSelected
                    ? "new-contact-user-selected"
                    : ""
                }`}
                onClick={() =>
                  selectUser(item)
                }
              >
                <div className="new-contact-avatar">
                  {item.avatar ? (
                    <img
                      src={item.avatar}
                      alt=""
                    />
                  ) : (
                    item.name
                      ?.charAt(0)
                      .toUpperCase()
                  )}
                </div>

                <div className="new-contact-user-info">
                  <h4>
  {highlightText(
    item.name,
    search
  )}
</h4>

<p>
  {highlightText(
    item.email,
    search
  )}
</p>
                </div>

                {isSelected && (
                  <div className="new-contact-check">
                    ✓
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

     {message && (
  <div className="new-contact-toast">
    {message}
  </div>
)}
      {/* ================= SAVE ================= */}

      {selectedUser && (
        <div className="new-contact-save-container">
          <button
            type="button"
            className="new-contact-save-button"
            onClick={saveContact}
            disabled={saving}
          >
            {saving ? (
              <span className="new-contact-button-spinner" />
            ) : (
              "Save"
            )}
          </button>
        </div>
      )}
    </div>
  );
}
