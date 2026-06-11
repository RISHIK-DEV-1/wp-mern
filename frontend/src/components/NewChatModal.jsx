import React, {
  useEffect,
  useState,
  useContext,
} from "react";

import API from "../utils/axios";
import { AuthContext } from "../context/AuthContext";

import "./NewChatModal.css";

export default function NewChatModal({
  isOpen,
  onClose,
  setSelectedUser,
}) {
  const { user } = useContext(AuthContext);

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  /* ================= FETCH USERS ================= */

  useEffect(() => {
    if (!isOpen) return;

    const fetchUsers = async () => {
      try {
        setLoading(true);

        const { data } = await API.get(
          "/auth/users"
        );

        const filtered = data.filter(
          (u) => u._id !== user._id
        );

        setUsers(filtered);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [isOpen, user]);

  if (!isOpen) return null;

  const filteredUsers = users.filter((u) =>
    u.name
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
    >
      <div
        className="modal-container"
        onClick={(e) =>
          e.stopPropagation()
        }
      >
        {/* HEADER */}
        <div className="modal-header">
          <h3>Start New Chat</h3>

          <button onClick={onClose}>
            ✕
          </button>
        </div>

        {/* SEARCH */}
        <input
          className="modal-search"
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
        />

        {/* USERS LIST */}
        <div className="modal-users">
          {loading ? (
            <p className="modal-msg">
              Loading users...
            </p>
          ) : filteredUsers.length ===
            0 ? (
            <p className="modal-msg">
              No users found
            </p>
          ) : (
            filteredUsers.map((u) => (
              <div
                key={u._id}
                className="modal-user"
                onClick={() => {
                  setSelectedUser(u);
                  onClose();
                }}
              >
                <div className="modal-avatar">
                  {u.name
                    ?.charAt(0)
                    .toUpperCase()}
                </div>

                <div className="modal-user-info">
                  <h4>{u.name}</h4>
                  <p>{u.email}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
