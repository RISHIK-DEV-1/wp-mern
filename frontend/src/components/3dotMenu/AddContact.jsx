import React, {
useEffect,
useRef,
useState,
} from "react";

import API from "../../utils/axios";

import "./AddContact.css";

export default function AddContact({
user,
selectedUser,
onClose,
onContactAdded,
}) {
const [name, setName] = useState("");
const [saving, setSaving] = useState(false);
const [error, setError] = useState("");

const [dragY, setDragY] = useState(0);

const sheetRef = useRef(null);

const draggingRef = useRef(false);
const startYRef = useRef(0);
const currentYRef = useRef(0);

/*

* Pre-fill the official name.
  */
  useEffect(() => {
  const officialName =
  selectedUser?.name?.trim() || "";

setName(officialName);
setError("");

}, [selectedUser]);

/*

* =========================
* DRAG START
* =========================
  */

const handleDragStart = (e) => {
if (saving) return;

draggingRef.current = true;

const clientY =
  e.touches?.[0]?.clientY ??
  e.clientY;

startYRef.current = clientY;
currentYRef.current = clientY;

document.body.style.userSelect = "none";

};

/*

* =========================
* DRAG MOVE
* =========================
  */

const handleDragMove = (e) => {
if (!draggingRef.current) return;

const clientY =
  e.touches?.[0]?.clientY ??
  e.clientY;

currentYRef.current = clientY;

const difference =
  clientY - startYRef.current;

/*
 * Only allow dragging downward.
 */
if (difference > 0) {
  setDragY(difference);
} else {
  setDragY(0);
}

};

/*

* =========================
* DRAG END
* =========================
  */

const handleDragEnd = () => {
if (!draggingRef.current) return;

draggingRef.current = false;

document.body.style.userSelect = "";

const distance =
  currentYRef.current -
  startYRef.current;

/*
 * Close sheet if dragged sufficiently.
 */
if (distance > 120) {
  setDragY(0);
  onClose();
  return;
}

/*
 * Otherwise return to normal position.
 */
setDragY(0);

};

/*

* Save contact.
  */
  const handleSave = async () => {
  const customName = name.trim();

/*
 * Do not allow empty or whitespace-only names.
 */
if (!customName) {
  setError("Name is required");
  return;
}

if (!user?._id || !selectedUser?._id) {
  setError("Unable to add contact");
  return;
}

try {
  setSaving(true);
  setError("");

  const { data } = await API.post(
    "/contacts",
    {
      userId: user._id,
      contactId: selectedUser._id,
      name: customName,
    }
  );

  if (onContactAdded) {
    onContactAdded(
      data?.contact || {
        ...selectedUser,
        contactName: customName,
        isContact: true,
      }
    );
  }

  onClose();
} catch (error) {
  setError(
    error?.response?.data?.message ||
      "Failed to add contact"
  );
} finally {
  setSaving(false);
}

};

return (
<>
{/* ================= OVERLAY ================= */}

  <div
    className="add-contact-overlay"
    onClick={() => {
      if (!saving) {
        onClose();
      }
    }}
  />

  {/* ================= BOTTOM SHEET ================= */}

  <div
    ref={sheetRef}
    className="add-contact-sheet"
    style={{
      transform: `translateY(${dragY}px)`,
      transition: draggingRef.current
        ? "none"
        : "transform 0.22s ease-out",
    }}
    onTouchMove={handleDragMove}
    onTouchEnd={handleDragEnd}
    onMouseMove={handleDragMove}
    onMouseUp={handleDragEnd}
    onMouseLeave={() => {
      if (draggingRef.current) {
        handleDragEnd();
      }
    }}
  >
    {/* ================= DRAGGER ================= */}

    <div
      className="add-contact-handle-area"
      onTouchStart={handleDragStart}
      onMouseDown={handleDragStart}
    >
      <div className="add-contact-handle" />
    </div>

    {/* ================= HEADER ================= */}

    <div className="add-contact-header">
      <h3>Add contact</h3>
    </div>

    {/* ================= BODY ================= */}

    <div className="add-contact-body">

      {/* NAME */}

      <div className="add-contact-field">
        <label htmlFor="contact-name">
          Name
        </label>

        <input
          id="contact-name"
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError("");
          }}
          disabled={saving}
          autoComplete="off"
        />
      </div>

      {/* EMAIL */}

      <div className="add-contact-field">
        <label htmlFor="contact-email">
          Email
        </label>

        <input
          id="contact-email"
          type="email"
          value={selectedUser?.email || ""}
          readOnly
          disabled
        />
      </div>

      {/* ERROR */}

      {error && (
        <div className="add-contact-error">
          {error}
        </div>
      )}

      {/* ACTIONS */}

      <div className="add-contact-actions">

        <button
          type="button"
          className="add-contact-cancel"
          onClick={onClose}
          disabled={saving}
        >
          Cancel
        </button>

        <button
          type="button"
          className="add-contact-save"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <span className="add-contact-spinner" />
          ) : (
            "Save"
          )}
        </button>

      </div>

    </div>
  </div>
</>

);
}
