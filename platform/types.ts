export interface Me {
  userId: string;
  name: string | null;
  effectiveRoles: string[];
}

export interface User {
  id: string;
  name: string;
  username: string | null;
  effectiveRoles?: string[];
  membership?: { roles: string[]; groupIds: string[] };
}

export interface GroupMember {
  type: "user" | "group";
  id: string;
}

export interface Group {
  id: string;
  name: string;
  roles: string[];
  members: GroupMember[];
  owners: string[];
}
