import {
  createContext,
  useEffect,
  useState,
} from "react";

export const AuthContext =
  createContext();

export default function AuthProvider({
  children,
}) {
  const [user, setUser] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    try {
      const storedUser =
        localStorage.getItem(
          "user"
        );

      if (storedUser) {
        setUser(
          JSON.parse(storedUser)
        );
      }
    } catch (error) {
      localStorage.removeItem(
        "user"
      );
    }

    setLoading(false);
  }, []);

  /* ================= LOGIN ================= */

  const loginUser = (data) => {
    setUser(data);

    localStorage.setItem(
      "user",
      JSON.stringify(data)
    );
  };

  /* ================= LOGOUT ================= */

  const logoutUser = () => {
    setUser(null);

    localStorage.removeItem(
      "user"
    );
  };

  /* ================= UPDATE USER ================= */

  const updateUser = (
    updatedUser
  ) => {
    setUser(updatedUser);

    localStorage.setItem(
      "user",
      JSON.stringify(updatedUser)
    );
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginUser,
        logoutUser,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
