"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import api, { refreshAccessToken } from "./api";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  getStoredUser,
  setStoredUser,
  setTokens,
} from "./tokenStorage";

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser<AuthUser>());
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    const response = await api.get<AuthUser>("profile/");
    setUser(response.data);
    setStoredUser(response.data);
  }, []);

  useEffect(() => {
    const init = async () => {
      const accessToken = getAccessToken();
      if (!accessToken) {
        setLoading(false);
        return;
      }

      try {
        await fetchProfile();
      } catch {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          try {
            await fetchProfile();
          } catch {
            clearTokens();
            setStoredUser(null);
            setUser(null);
          }
        } else {
          clearTokens();
          setStoredUser(null);
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [fetchProfile]);

  const login = useCallback(async (username: string, password: string) => {
    const response = await api.post<{ access: string; refresh?: string; user?: AuthUser }>(
      "login/",
      { username, password }
    );
    const { access, refresh, user: userData } = response.data || {};

    if (access) {
      setTokens(access, refresh);
    }

    if (userData) {
      setUser(userData);
      setStoredUser(userData);
      return;
    }

    await fetchProfile();
  }, [fetchProfile]);

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken();
    try {
      if (refreshToken) {
        await api.post("logout/", { refresh: refreshToken });
      }
    } catch {
      // Ignore logout errors; we'll clear local session regardless.
    }

    clearTokens();
    setStoredUser(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      login,
      logout,
      refreshProfile: fetchProfile,
    }),
    [user, loading, fetchProfile, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};



