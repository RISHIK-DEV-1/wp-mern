import React, { useState } from "react";
import { Link } from "react-router-dom";
import API from "../utils/axios";
import "./ForgotPassword.css";
export default function ForgotPassword() {
  const [email, setEmail] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const { data } =
        await API.post(
          "/auth/forgot-password",
          { email }
        );

      setMessage(data.message);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Request failed"
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
        <h2>Forgot Password</h2>

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
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          required
        />

        <button
          type="submit"
          disabled={loading}
        >
          {loading ? (
            <div className="spinner"></div>
          ) : (
            "Send Reset Link"
          )}
        </button>

        <p>
          <Link to="/login">
            Back to Login
          </Link>
        </p>
      </form>
    </div>
  );
}
