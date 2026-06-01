import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../utils/axios";
import { AuthContext } from "../context/AuthContext";
import "./Login.css";
export default function Login() {
  const navigate = useNavigate();
  const { loginUser } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const { data } = await API.post(
        "/auth/login",
        formData
      );

      loginUser(data);

      navigate("/chat");
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Login failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!formData.email) {
      setError(
        "Enter email to resend verification"
      );
      return;
    }

    setResendLoading(true);
    setError("");
    setMessage("");

    try {
      const { data } = await API.post(
        "/auth/resend-verification",
        {
          email: formData.email,
        }
      );

      setMessage(data.message);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Failed to resend email"
      );
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form
        className="auth-box"
        onSubmit={handleSubmit}
      >
        <h2>Login</h2>

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
          placeholder="Email"
          name="email"
          onChange={handleChange}
          required
        />

        <input
          type="password"
          placeholder="Password"
          name="password"
          onChange={handleChange}
          required
        />

        <button
          type="submit"
          disabled={loading}
        >
          {loading ? (
            <div className="spinner"></div>
          ) : (
            "Login"
          )}
        </button>

        <button
  type="button"
  onClick={handleResend}
  disabled={resendLoading}
  className="resend-btn"
>
          {resendLoading
            ? "Sending..."
            : "Resend Verification Email"}
        </button>

        <p>
          <Link to="/forgot-password">
            Forgot Password?
          </Link>
        </p>

        <p>
          New user?{" "}
          <Link to="/register">
            Register
          </Link>
        </p>
      </form>
    </div>
  );
}
