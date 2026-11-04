import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { AuthContext } from "./AuthContext";
import { setUnauthorizedHandler, tokenStore } from "../Services/ApiClient";
import {
  getMe,
  login as loginRequest,
  logout as logoutRequest,
} from "../Services/AuthServices";
import type { User } from "../Types";

const HEARTBEAT_MS = 10 * 60 * 1000; // while the user is active, ping the API at most every 10 minutes

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(() => !tokenStore.get()); // nothing to check when there is no token
  const [notice, setNotice] = useState("");
  const idleMinutes = useRef(60);
  const lastActivity = useRef(0);
  const lastPing = useRef(0);

  const clearSession = useCallback((message = "") => {
    tokenStore.clear();
    setUser(null);
    setNotice(message);
  }, []);

  // 1. On first load, validate a token left in sessionStorage (e.g. after a page refresh).
  useEffect(() => {
    setUnauthorizedHandler(() =>
      clearSession("Your session expired. Please sign in again."),
    );
    if (!tokenStore.get()) return;
    idleMinutes.current = tokenStore.idleMinutes();
    getMe()
      .then(setUser)
      .catch(() => {
        if (tokenStore.get()) clearSession();
      })
      .finally(() => setReady(true));
  }, [clearSession]);

  // 2. While logged in: track activity, send a keep-alive, and sign out after the idle limit.
  useEffect(() => {
    if (!user) return;
    lastActivity.current = Date.now();
    lastPing.current = Date.now();

    const onActivity = () => {
      const now = Date.now();
      lastActivity.current = now;
      if (now - lastPing.current > HEARTBEAT_MS) {
        lastPing.current = now;
        getMe().catch(() => {}); // refreshes the server-side idle timer
      }
    };
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((e) =>
      window.addEventListener(e, onActivity, { passive: true }),
    );

    const timer = setInterval(() => {
      if (Date.now() - lastActivity.current > idleMinutes.current * 60 * 1000) {
        clearSession("You were signed out after being inactive."); // the server session expires on its own
      }
    }, 15000);

    return () => {
      events.forEach((e) => window.removeEventListener(e, onActivity));
      clearInterval(timer);
    };
  }, [user, clearSession]);

  const login = async (email: string, password: string) => {
    const res = await loginRequest(email, password);
    tokenStore.set(res.token, res.idleTime);
    idleMinutes.current = res.idleTime;
    setNotice("");
    setUser(res.user);
  };

  const logout = async () => {
    try {
      await logoutRequest();
    } catch {
      /* the token may already be dead; still sign out locally */
    }
    clearSession("You have been signed out.");
  };

  return (
    <AuthContext.Provider
      value={{ user, ready, notice, login, logout, updateUser: setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}
