import React, {
  useEffect,
  useState,
  useContext,
} from "react";

import API from "../utils/axios";

import { AuthContext } from "../context/AuthContext";

export default function Sidebar({
  selectedUser,
  setSelectedUser,
}) {
  const { user } =
    useContext(AuthContext);

  const [users, setUsers] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } =
          await API.get(
            "/auth/users"
          );

        const filteredUsers =
          data.filter(
            (u) =>
              u._id !== user._id
          );

        setUsers(filteredUsers);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [user]);

  return (
    <div className="sidebar">
      <h3>Chats</h3>

      {loading ? (
        <div
          style={{
            padding: "20px",
          }}
        >
          Loading users...
        </div>
      ) : users.length === 0 ? (
        <div
          style={{
            padding: "20px",
          }}
        >
          No users found
        </div>
      ) : (
        users.map((u) => (
          <div
            key={u._id}
            className="sidebar-chat"
            onClick={() =>
              setSelectedUser(u)
            }
            style={{
              background:
                selectedUser?._id ===
                u._id
                  ? "#202c33"
                  : "transparent",
            }}
          >
            <h4>{u.name}</h4>

            <p
              style={{
                fontSize: "13px",
                opacity: 0.7,
                marginTop: "4px",
              }}
            >
              {u.email}
            </p>
          </div>
        ))
      )}
    </div>
  );
}
