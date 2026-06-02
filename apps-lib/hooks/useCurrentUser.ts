import { useState, useEffect } from "react";

export interface CurrentUser {
  id: string;
  name: string;
}

/**
 * Returns the currently logged-in user from the session, or null if not authenticated.
 * Fetches once on mount from GET /auth/me.
 *
 * @example
 * const user = useCurrentUser();
 * if (!user) return <p>Not logged in</p>;
 * return <p>Hello, {user.name}</p>;
 */
export function useCurrentUser(): CurrentUser | null | undefined {
  // undefined = loading, null = unauthenticated, CurrentUser = authenticated
  const [user, setUser] = useState<CurrentUser | null | undefined>(undefined);

  useEffect(() => {
    fetch("/auth/me")
      .then((res) => {
        if (res.status === 401) return null;
        if (!res.ok) throw new Error(`/auth/me failed: ${res.status}`);
        return res.json() as Promise<CurrentUser>;
      })
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  return user;
}
