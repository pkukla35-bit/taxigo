import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";

const BACKEND = process.env.EXPO_PUBLIC_BACKEND_URL as string;

// Configure notification handler (foreground notifications shown as banner)
if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowAlert: true,
    }),
  });
}

async function registerForPushAsync(): Promise<string | null> {
  if (Platform.OS === "web") return null;
  if (!Device.isDevice) return null;
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let final = existing;
    if (existing !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      final = status;
    }
    if (final !== "granted") return null;
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    return token;
  } catch {
    return null;
  }
}

export type Role = "passenger" | "driver";
export type AppUser = {
  user_id: string;
  email: string;
  name: string;
  picture?: string | null;
  role?: Role;
  car_model?: string | null;
  plate?: string | null;
  rating_avg?: number;
  rating_count?: number;
  is_online?: boolean;
};

type Ctx = {
  user: AppUser | null;
  token: string | null;
  loading: boolean;
  signInWithSession: (sessionId: string, role: Role) => Promise<AppUser | null>;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
  setRole: (role: Role, car_model?: string, plate?: string) => Promise<void>;
  authFetch: (path: string, init?: RequestInit) => Promise<Response>;
};

const AuthCtx = createContext<Ctx | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const authFetch = useCallback(
    async (path: string, init: RequestInit = {}) => {
      const headers: any = { "Content-Type": "application/json", ...(init.headers || {}) };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      return fetch(`${BACKEND}${path}`, { ...init, headers, credentials: "include" });
    },
    [token]
  );

  const refresh = useCallback(async () => {
    if (!token) {
      setUser(null);
      return;
    }
    try {
      const r = await fetch(`${BACKEND}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      if (r.ok) {
        const data = await r.json();
        setUser(data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }, [token]);

  useEffect(() => {
    (async () => {
      const t = await AsyncStorage.getItem("session_token");
      if (t) setToken(t);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (token) refresh();
  }, [token, refresh]);

  // Register for push notifications after login
  useEffect(() => {
    if (!token || !user) return;
    (async () => {
      const pushToken = await registerForPushAsync();
      if (pushToken) {
        try {
          await fetch(`${BACKEND}/api/auth/push-token`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ push_token: pushToken, platform: Platform.OS }),
          });
        } catch {}
      }
    })();
  }, [token, user]);

  const signInWithSession = async (sessionId: string, role: Role) => {
    try {
      const r = await fetch(`${BACKEND}/api/auth/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ session_id: sessionId, role }),
      });
      if (!r.ok) return null;
      const data = await r.json();
      await AsyncStorage.setItem("session_token", data.session_token);
      setToken(data.session_token);
      setUser(data.user);
      return data.user as AppUser;
    } catch {
      return null;
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await fetch(`${BACKEND}/api/auth/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        });
      }
    } catch {}
    await AsyncStorage.removeItem("session_token");
    setToken(null);
    setUser(null);
  };

  const setRole = async (role: Role, car_model?: string, plate?: string) => {
    const r = await authFetch("/api/auth/role", {
      method: "POST",
      body: JSON.stringify({ role, car_model, plate }),
    });
    if (r.ok) {
      const u = await r.json();
      setUser(u);
    }
  };

  return (
    <AuthCtx.Provider value={{ user, token, loading, signInWithSession, refresh, logout, setRole, authFetch }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
