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
    const storedUser =
      localStorage.getItem(
        "user"
      );

    if (storedUser) {
      setUser(
        JSON.parse(storedUser)
      );
    }

    setLoading(false);
  }, []);

  const loginUser = (data) => {
    setUser(data);

    localStorage.setItem(
      "user",
      JSON.stringify(data)
    );
  };

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
