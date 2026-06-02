import { useState, useEffect } from "react";

interface AppMeResponse {
  userId: string;
  name: string;
  effectiveRoles: string[];
}

const cache = new Map<string, AppMeResponse>();

/**
 * Fetches the current user's resolved roles for a given app.
 * Returns the full AppMeResponse, or null if unauthenticated / not a member.
 *
 * Uses a module-level cache so multiple calls with the same appId in one render
 * cycle only make one request.
 */
function fetchAppMe(appId: string): Promise<AppMeResponse | null> {
  return fetch(`/platform/${appId}/api/me`, { credentials: "include" })
    .then((res) => {
      if (res.status === 401 || res.status === 403) return null;
      if (!res.ok)
        throw new Error(`/platform/${appId}/api/me failed: ${res.status}`);
      return res.json() as Promise<AppMeResponse>;
    })
    .catch(() => null);
}

/**
 * Returns whether the current user has a specific role in the given app.
 * Resolves roles recursively (including group membership).
 *
 * @example
 * const isAdmin = useHasRole("leave-a-note", "admin");
 * // true | false | undefined (loading)
 */
export function useHasRole(appId: string, role: string): boolean | undefined {
  const [hasRole, setHasRole] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    const cached = cache.get(appId);
    if (cached) {
      setHasRole(cached.effectiveRoles.includes(role));
      return;
    }
    fetchAppMe(appId).then((data) => {
      if (data) cache.set(appId, data);
      setHasRole(data?.effectiveRoles.includes(role) ?? false);
    });
  }, [appId, role]);

  return hasRole;
}

/**
 * Returns all effective roles the current user has in the given app.
 * Returns undefined while loading.
 *
 * @example
 * const roles = useAppRoles("leave-a-note");
 * // ["admin", "editor"] | [] | undefined (loading)
 */
export function useAppRoles(appId: string): string[] | undefined {
  const [roles, setRoles] = useState<string[] | undefined>(undefined);

  useEffect(() => {
    const cached = cache.get(appId);
    if (cached) {
      setRoles(cached.effectiveRoles);
      return;
    }
    fetchAppMe(appId).then((data) => {
      if (data) cache.set(appId, data);
      setRoles(data?.effectiveRoles ?? []);
    });
  }, [appId]);

  return roles;
}
