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

  const [contactName, setContactName] =
    useState("");

  const [alreadyContact, setAlreadyContact] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [checkingContact, setCheckingContact] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  /* ================= MESSAGE ================= */

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
    setContactName("");
    setAlreadyContact(false);
  };

  const closeSearch = () => {
    setSearchMode(false);
    setSearch("");
    setUsers([]);
    setSelectedUser(null);
    setContactName("");
    setAlreadyContact(false);
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

  const selectUser = async (selected) => {
    setSelectedUser(selected);

    /*
     * Initially use the official name.
     * The user can edit or completely clear it.
     */
    setContactName(
      selected.name || ""
    );

    setAlreadyContact(false);

    if (!user?._id || !selected?._id) {
      return;
    }

    try {
      setCheckingContact(true);

      const { data } = await API.get(
        `/contacts/check/${user._id}/${selected._id}`
      );

      if (data?.isContact) {
        setAlreadyContact(true);

        /*
         * If an existing personal contact name
         * exists, show it.
         *
         * Otherwise show official name.
         */
        setContactName(
          data.contactName?.trim() ||
            selected.name ||
            ""
        );
      }
    } catch (error) {
      console.error(
        "Check Contact Error:",
        error
      );
    } finally {
      setCheckingContact(false);
    }
  };

  /* ================= SAVE CONTACT ================= */

const saveContact = async () => {
  if (
    !user?._id ||
    !selectedUser?._id ||
    alreadyContact
  ) {
    return;
  }

  const trimmedName = contactName.trim();

  /*
   * Contact name is required.
   */
  if (!trimmedName) {
    showMessage("Name is required");
    return;
  }

  try {
    setSaving(true);

    await API.post("/contacts", {
      userId: user._id,
      contactId: selectedUser._id,
      name: trimmedName,
    });

    /*
     * Contact successfully added.
     */
    navigate(-1);
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

  /* ================= RENDER ================= */

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
        ) : selectedUser ? (

          /* ================= CONTACT FORM ================= */

          <div className="new-contact-form">

            <div className="new-contact-form-avatar">
              {selectedUser.avatar ? (
                <img
                  src={selectedUser.avatar}
                  alt=""
                />
              ) : (
                selectedUser.name
                  ?.charAt(0)
                  .toUpperCase()
              )}
            </div>

            <div className="new-contact-form-field">
              <label>
                Name
              </label>

              <input
                type="text"
                value={contactName}
                onChange={(e) =>
                  setContactName(
                    e.target.value
                  )
                }
                placeholder="Contact name"
                disabled={checkingContact}
              />
            </div>

            <div className="new-contact-form-field">
              <label>
                Email
              </label>

              <input
                type="email"
                value={selectedUser.email || ""}
                readOnly
                className="new-contact-readonly"
              />
            </div>

            {checkingContact ? (
              <div className="new-contact-checking">
                <span className="new-contact-small-spinner" />
              </div>
            ) : alreadyContact ? (
              <div className="new-contact-already">
                ✓ Already in contacts
              </div>
            ) : null}

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
            return (
              <div
                key={item._id}
                className="new-contact-user"
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
              </div>
            );
          })
        )}

      </div>

      {/* ================= TOAST ================= */}

      {message && (
        <div className="new-contact-toast">
          {message}
        </div>
      )}

      {/* ================= SAVE ================= */}

      {selectedUser && !alreadyContact && (
        <div className="new-contact-save-container">
          <button
            type="button"
            className="new-contact-save-button"
            onClick={saveContact}
            disabled={
              saving ||
              checkingContact
            }
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
