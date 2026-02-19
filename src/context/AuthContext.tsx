"use client";

import { onIdTokenChanged, type User } from "firebase/auth";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { getFirebaseAuth } from "@/lib/firebase-client";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
});

function hasSessionCookie(): boolean {
  return document.cookie
    .split(";")
    .some((c) => c.trim().startsWith("__session="));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hadCookie = hasSessionCookie();

    const unsubscribe = onIdTokenChanged(getFirebaseAuth(), async (u) => {
      setUser(u);
      setLoading(false);

      if (u) {
        const token = await u.getIdToken();
        document.cookie = `__session=${token}; path=/; max-age=3600; SameSite=Lax`;

        // If the server rendered without auth (no cookie on initial load) but
        // the client resolved auth from IndexedDB or a redirect, reload so the
        // server can render the full authenticated layout.
        if (!hadCookie) {
          window.location.reload();
          return;
        }
      } else {
        document.cookie = "__session=; path=/; max-age=0";
      }
    });

    return unsubscribe;
  }, []);

  return <AuthContext value={{ user, loading }}>{children}</AuthContext>;
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
