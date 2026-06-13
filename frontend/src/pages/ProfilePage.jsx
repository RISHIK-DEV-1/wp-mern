import React, {
  useContext,
  useState,
} from "react";

import {
  AuthContext,
} from "../context/AuthContext";

import API from "../utils/axios";

import "./ProfilePage.css";

export default function ProfilePage() {
  const {
    user,
    updateUser,
  } = useContext(AuthContext);

  const [image, setImage] =
    useState(null);

  const [uploading, setUploading] =
    useState(false);

  const handleUpload =
    async () => {
      if (!image) return;

      setUploading(true);

      try {
        const reader =
          new FileReader();

        reader.readAsDataURL(image);

        reader.onloadend =
          async () => {
            try {
              const { data } =
                await API.put(
                  "/auth/avatar",
                  {
                    userId:
                      user._id,
                    avatar:
                      reader.result,
                  }
                );

              updateUser({
                ...user,
                avatar: data.avatar,
              });
            } catch (error) {
              alert(
                error?.response?.data
                  ?.message ||
                  error.message
              );
            } finally {
              setUploading(false);
            }
          };
      } catch (error) {
        alert(
          error?.response?.data
            ?.message ||
            error.message
        );

        setUploading(false);
      }
    };

  return (
    <div className="profile-page">
      <div className="profile-card">
        <div className="profile-avatar">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt="Profile"
              className="avatar-image"
            />
          ) : (
            user?.name
              ?.charAt(0)
              .toUpperCase()
          )}
        </div>

        <h2>{user?.name}</h2>

        <p>{user?.email}</p>

        <input
          type="file"
          accept="image/*"
          onChange={(e) =>
            setImage(
              e.target.files[0]
            )
          }
          className="avatar-input"
        />

        <button
          className="edit-profile-btn"
          onClick={
            handleUpload
          }
          disabled={
            uploading
          }
        >
          {uploading
            ? "Uploading..."
            : "Upload Photo"}
        </button>
      </div>
    </div>
  );
}
