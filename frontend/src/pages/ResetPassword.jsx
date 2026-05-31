import React, {
  useState,
} from "react";

import {
  useParams,
  useNavigate,
} from "react-router-dom";

import API from "../utils/axios";

export default function ResetPassword() {
  const { token } = useParams();

  const navigate = useNavigate();

  const [password, setPassword] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const isStrongPassword = (
    password
  ) => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(
      password
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (
      password !== confirmPassword
    ) {
      setError(
        "Passwords do not match"
      );
      return;
    }

    if (
      !isStrongPassword(password)
    ) {
      setError(
        "Password must contain at least 8 characters, one uppercase letter, one lowercase letter and one number"
      );
      return;
    }

    setLoading(true);

    try {
      const { data } =
        await API.post(
          `/auth/reset-password/${token}`,
          {
            password,
          }
        );

      setMessage(data.message);

      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (error) {
      setError(
        error.response?.data
          ?.message ||
          "Reset failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form
        className="auth-box"
        onSubmit={handleSubmit}
      >
        <h2>Reset Password</h2>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {message && (
          <div className="success-message">
            {message}
          </div>
        )}

        <input
          type="password"
          placeholder="New Password"
          value={password}
          onChange={(e) =>
            setPassword(
              e.target.value
            )
          }
          required
        />

        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) =>
            setConfirmPassword(
              e.target.value
            )
          }
          required
        />

        <small
          style={{
            color: "#666",
            marginBottom: "10px",
            display: "block",
          }}
        >
          Password must contain:
          8+ characters,
          1 uppercase letter,
          1 lowercase letter,
          and 1 number.
        </small>

        <button
          type="submit"
          disabled={loading}
        >
          {loading ? (
            <div className="spinner"></div>
          ) : (
            "Reset Password"
          )}
        </button>
      </form>
    </div>
  );
}
