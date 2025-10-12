"use client";

import { authApi } from "@/lib/api";
import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";
import { User } from "@/lib/types";

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("auth_token");
    const storedUser = localStorage.getItem("auth_user");

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
        toast.success(`Welcome back, ${parsedUser.name}!`);
      } catch {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
        toast.error("Session expired. Please sign in again.");
      }
    }

    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login({ email, password });

      const data = response.data;
      if (!data?.token || !data?.user) {
        throw new Error("Invalid login response");
      }

      setToken(data.token);
      setUser(data.user);

      localStorage.setItem("auth_token", data.token);
      localStorage.setItem("auth_user", JSON.stringify(data.user));
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    const userName = user?.name;
    setToken(null);
    setUser(null);
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    toast.success(
      userName ? `Goodbye, ${userName}!` : "Successfully signed out"
    );
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
