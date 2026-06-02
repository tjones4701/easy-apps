import { useCallback, useEffect, useState } from "react";
import type { Me, User, Group } from "./types";

export interface AdminData {
  me: Me | null;
  memberOf: Group[];
  ownerOf: Group[];
  allUsers: User[];
  allGroups: Group[];
  loading: boolean;
  error: string | null;
  reload: () => void;
  api: <T = unknown>(
    method: string,
    path: string,
    body?: unknown,
  ) => Promise<T>;
}

export function useAdminData(appId: string): AdminData {
  const [me, setMe] = useState<Me | null>(null);
  const [memberOf, setMemberOf] = useState<Group[]>([]);
  const [ownerOf, setOwnerOf] = useState<Group[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const api = useCallback(
    async <T = unknown>(
      method: string,
      path: string,
      body?: unknown,
    ): Promise<T> => {
      const opts: RequestInit = {
        method,
        headers: { "Content-Type": "application/json" },
      };
      if (body !== undefined) opts.body = JSON.stringify(body);
      const r = await fetch(`/platform/${appId}/api/${path}`, opts);
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? r.statusText);
      return d as T;
    },
    [appId],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [meData, myGroupsData] = await Promise.all([
        api<Me>("GET", "me"),
        api<{ memberOf: Group[]; ownerOf: Group[] }>("GET", "my-groups"),
      ]);
      setMe(meData);
      setMemberOf(myGroupsData.memberOf);
      setOwnerOf(myGroupsData.ownerOf);

      if (meData.effectiveRoles.includes("admin")) {
        const [users, groups] = await Promise.all([
          api<User[]>("GET", "users"),
          api<Group[]>("GET", "groups"),
        ]);
        setAllUsers(users);
        setAllGroups(groups);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    me,
    memberOf,
    ownerOf,
    allUsers,
    allGroups,
    loading,
    error,
    reload: load,
    api,
  };
}
