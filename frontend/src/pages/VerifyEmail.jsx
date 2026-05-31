import React, {
  useEffect,
  useState,
} from "react";

import {
  useParams,
  useNavigate,
} from "react-router-dom";

import API from "../utils/axios";

export default function VerifyEmail() {
  const { token } = useParams();

  const navigate = useNavigate();

  const [loading, setLoading] =
    useState(true);

  const [message, setMessage] =
    useState("");

  const [success, setSuccess] =
    useState(false);

  useEffect(() => {
    const verifyUser = async () => {
      try {
        const { data } =
          await API.get(
            `/auth/verify-email/${token}`
          );

        setMessage(data.message);

        setSuccess(true);

        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } catch (error) {
        setMessage(
          error.response?.data
            ?.message ||
            "Verification failed"
        );
      } finally {
        setLoading(false);
      }
    };

    verifyUser();
  }, [token, navigate]);

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Email Verification</h2>

        {loading ? (
          <div className="verify-loader">
            <div className="spinner"></div>
          </div>
        ) : (
          <>
            <div
              className={
                success
                  ? "success-message"
                  : "error-message"
              }
            >
              {message}
            </div>

            {success && (
              <p>
                Redirecting to login...
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
