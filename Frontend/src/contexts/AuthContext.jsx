import { useState, useEffect } from "react";
import API from "../services/api";
import { AuthContext } from "./AuthContextValue";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    API.get("/auth/me")
      .then((res) => {
        if (active) setUser(res.data);
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const login = async (email, password) => {
    const res = await API.post("/auth/login", { email, password });
    setUser(res.data.user);
    return res.data;
  };

  const logout = async () => {
    try {
      await API.post("/auth/logout");
    } finally {
      setUser(null);
    }
  };

  const updateUser = (changes) => {
    setUser((currentUser) => {
      if (!currentUser) return currentUser;
      return { ...currentUser, ...changes };
    });
  };

  const signup = async (data) => {
    const res = await API.post("/auth/signup", data);
    setUser(res.data.user);
    return res.data;
  };

  return (
    <AuthContext.Provider
      value={{ user, login, logout, signup, updateUser, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};
