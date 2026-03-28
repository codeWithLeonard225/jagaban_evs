"use client";
// app/context/AuthContext.jsx

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Restore session
  useEffect(() => {
    const savedSession = localStorage.getItem("userSession");
    if (savedSession) {
      const userData = JSON.parse(savedSession);

      const role =
        userData.type === "coordinator"
          ? "coordinator"
          : userData.role?.toLowerCase();

      setUser({ data: userData, role });
    }
    setLoading(false);
  }, []);

  // LOGIN
  const login = (userData) => {
    const role =
      userData.type === "coordinator"
        ? "coordinator"
        : userData.role?.toLowerCase();

    let authPath = "/";
    if (role === "coordinator") authPath = "/ConstituencyForm";
    else if (role === "ceo") authPath = "/dashboard/Ceo_admin";
    else if (role === "media") authPath = "/dashboard/Media_Admin";
    else if (role === "coordinator_admin") authPath = "/dashboard/Cordinator_Admin";

    // Save session
    localStorage.setItem("userSession", JSON.stringify(userData));

    // Cookies for middleware
    document.cookie = `userRole=${role}; path=/; max-age=86400; SameSite=Lax`;
    document.cookie = `authPath=${authPath}; path=/; max-age=86400; SameSite=Lax`;

    setUser({ data: userData, role, authorizedPath: authPath });

    return authPath;
  };

  // LOGOUT
  const logout = () => {
    localStorage.removeItem("userSession");

    document.cookie = "userRole=; path=/; max-age=0;";
    document.cookie = "authPath=; path=/; max-age=0;";

    setUser(null);
    router.push("/");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);