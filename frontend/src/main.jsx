import React from "react";
import ReactDOM from "react-dom/client";

import { GoogleOAuthProvider } from "@react-oauth/google";

import App from "./App";
import AuthProvider from "./context/AuthContext";

ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <GoogleOAuthProvider
    clientId={
      import.meta.env
        .VITE_GOOGLE_CLIENT_ID
    }
  >
    <AuthProvider>
      <App />
    </AuthProvider>
  </GoogleOAuthProvider>
);
