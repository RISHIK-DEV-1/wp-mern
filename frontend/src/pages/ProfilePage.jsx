import React, {
  useContext,
  useState,
  useRef,
  useCallback,
} from "react";

import Cropper from "react-easy-crop";

import { AuthContext } from "../context/AuthContext";
import API from "../utils/axios";

import "./ProfilePage.css";

/* ================= UTILS ================= */

const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.src = url;
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = reject;
  });

async function getCroppedImg(imageSrc, crop) {
  const image = await createImage(imageSrc);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = crop.width;
  canvas.height = crop.height;

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob((file) => resolve(file), "image/jpeg");
  });
}

/* ================= COMPONENT ================= */

export default function ProfilePage() {
  const { user, updateUser } = useContext(AuthContext);

  const fileInputRef = useRef(null);

  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const [uploading, setUploading] = useState(false);

  /* ================= OPEN FILE PICKER ================= */

  const openFilePicker = () => {
    fileInputRef.current.click();
  };

  /* ================= FILE SELECT ================= */

  const onFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = () => {
      setImageSrc(reader.result);
    };
  };

  /* ================= CROP COMPLETE ================= */

  const onCropComplete = useCallback((_, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  /* ================= UPLOAD ================= */

  const handleUpload = async () => {
    if (!imageSrc || !croppedAreaPixels || uploading) return;

    setUploading(true);

    try {
      const croppedBlob = await getCroppedImg(
        imageSrc,
        croppedAreaPixels
      );

      const reader = new FileReader();

      reader.readAsDataURL(croppedBlob);

      reader.onloadend = async () => {
        try {
          const { data } = await API.put("/auth/avatar", {
            userId: user._id,
            avatar: reader.result,
          });

          updateUser({
            ...user,
            avatar: data.avatar,
          });

          setImageSrc(null);

          setTimeout(() => {
            setUploading(false);
          }, 300);
        } catch (error) {
          alert(
            error?.response?.data?.message ||
              error.message
          );
          setUploading(false);
        }
      };
    } catch (error) {
      alert(
        error?.response?.data?.message ||
          error.message
      );
      setUploading(false);
    }
  };

  /* ================= UI ================= */

  return (
    <div className="profile-page">
      <div className="profile-card">

        {/* Avatar */}
        <div className="profile-avatar">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt="avatar"
              className="avatar-image"
            />
          ) : (
            user?.name?.charAt(0).toUpperCase()
          )}
        </div>

        <h2>{user?.name}</h2>
        <p>{user?.email}</p>

        {/* Hidden file input */}
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          className="hidden-input"
          onChange={onFileChange}
        />

        {/* ================= UPLOAD BUTTON ================= */}
        <button
          className="edit-profile-btn upload-btn"
          onClick={openFilePicker}
          disabled={uploading}
        >
          {uploading && !imageSrc ? (
            <span className="spinner"></span>
          ) : (
            "Upload Photo"
          )}
        </button>

        {/* ================= CROPPER ================= */}

        {imageSrc && (
          <div className="cropper-overlay">
            <div className="cropper-box">

              <div className="cropper-area">
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>

              <div className="cropper-actions">

                {/* CANCEL */}
                <button
                  className="crop-btn cancel"
                  onClick={() => {
                    setImageSrc(null);
                    setUploading(false);
                  }}
                  disabled={uploading}
                >
                  Cancel
                </button>

                {/* SAVE */}
                <button
                  className="crop-btn save"
                  onClick={handleUpload}
                  disabled={uploading}
                >
                  {uploading ? (
                    <span className="spinner"></span>
                  ) : (
                    "Save"
                  )}
                </button>

              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
