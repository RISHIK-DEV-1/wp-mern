import React, {
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import API from "../utils/axios";
import "./Register.css";
export default function Register() {
  const navigate = useNavigate();

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [formData, setFormData] =
    useState({
      name: "",
      email: "",
      password: "",
    });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]:
        e.target.value,
    });
  };

  const isStrongPassword = (
    password
  ) => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(
      password
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    setError("");
    setSuccess("");

    if (
      !isStrongPassword(
        formData.password
      )
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
          "/auth/register",
          formData
        );

      setSuccess(data.message);

      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (error) {
      setError(
        error.response?.data
          ?.message ||
          "Something went wrong"
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
        <h2>Register</h2>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {success && (
          <div className="success-message">
            {success}
          </div>
        )}

        <input
          type="text"
          placeholder="Name"
          name="name"
          onChange={handleChange}
          required
        />

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

        <small className="password-hint">
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
            "Register"
          )}
        </button>

        <p>
          Already have account?{" "}
          <Link to="/login">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}
