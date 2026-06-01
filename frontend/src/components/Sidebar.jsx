import React, {
  useEffect,
  useState,
  useContext,
} from "react";

import API from "../utils/axios";

import { AuthContext } from "../context/AuthContext";
import "./Sidebar.css";
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
        <div className="sidebar-message">
  Loading users...
</div>
      ) : users.length === 0 ? (
        <div className="sidebar-message">
  No users found
</div>
      ) : (
        users.map((u) => (
          <div
            key={u._id}
            className={`sidebar-chat ${
  selectedUser?._id === u._id
    ? "active"
    : ""
}`}
            onClick={() =>
              setSelectedUser(u)
            }
          >
            <h4>{u.name}</h4>

            <p className="sidebar-email">
              {u.email}
            </p>
          </div>
        ))
      )}
    </div>
  );
}
