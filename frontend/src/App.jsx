import React, { useContext } from "react";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Chat from "./pages/Chat";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ProfilePage from "./pages/ProfilePage";
import ProtectedRoute from "./routes/ProtectedRoute";
import ForwardScreen from "./pages/ForwardScreen";
import Starred from "./pages/Starred";
import NewChatModal from "./components/NewChatModal";
import NewContact from "./pages/NewContact";
import { AuthContext } from "./context/AuthContext";

import "./index.css";

export default function App() {
  const { user, loading } =
    useContext(AuthContext);

  if (loading) {
    return null;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Smart Home Route */}
        <Route
          path="/"
          element={
            user ? (
              <Navigate
                to="/chat"
                replace
              />
            ) : (
              <Navigate
                to="/login"
                replace
              />
            )
          }
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/verify-email/:token"
          element={<VerifyEmail />}
        />

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        <Route
          path="/reset-password/:token"
          element={<ResetPassword />}
        />

        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/starred"
          element={
            <ProtectedRoute>
              <Starred />
            </ProtectedRoute>
          }
        />

        <Route
          path="/forward"
          element={
            <ProtectedRoute>
              <ForwardScreen />
            </ProtectedRoute>
          }
        />
        
       <Route
  path="/new-chat"
  element={
    <ProtectedRoute>
      <NewChatModal />
    </ProtectedRoute>
  }
/>
        <Route
  path="/new-contact"
  element={
    <ProtectedRoute>
      <NewContact />
    </ProtectedRoute>
  }
/>

        {/* Unknown Routes */}
        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
