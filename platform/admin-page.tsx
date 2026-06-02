import React, { useState } from 'react';
import styles from './admin-page.module.scss';
import { useAdminData } from './useAdminData';
import { GroupCard } from './GroupCard';
import type { User, Group } from './types';

// ── Admin Page ────────────────────────────────────────────────────────────────

interface AdminPageProps {
  appId: string;
}

const AdminPage: React.FC<AdminPageProps> = ({ appId }) => {
  const { me, memberOf, ownerOf, allUsers, allGroups, loading, error, reload, api } =
    useAdminData(appId);

  const isAdmin = me?.effectiveRoles.includes('admin') ?? false;

  const addMember = async (groupId: string, userId: string) => {
    await api('POST', `groups/${groupId}/members`, { type: 'user', id: userId });
    await reload();
  };

  const removeMember = async (groupId: string, userId: string) => {
    await api('DELETE', `groups/${groupId}/members?type=user&id=${encodeURIComponent(userId)}`);
    await reload();
  };

  const deleteGroup = async (groupId: string) => {
    if (!confirm('Delete this group? Members will lose any roles it grants.')) return;
    await api('DELETE', `groups/${groupId}`);
    await reload();
  };

  const [tab, setTab] = useState<'mine' | 'users' | 'groups'>('mine');

  if (loading) return <p className={styles.status}>Loading…</p>;
  if (error) return <p className={`${styles.status} ${styles.err}`}>{error}</p>;

  return (
    <div className={styles.body}>
      <header className={styles.hdr}>
        <a className={styles.back} href={`/apps/${appId}/`}>← App</a>
        <h1>Admin — <span className={styles.appId}>{appId}</span></h1>
        <form method="POST" action="/auth/logout" style={{ margin: 0 }}>
          <button className={`${styles.btn} ${styles.ghost}`} type="submit">Sign out</button>
        </form>
      </header>

      {isAdmin && (
        <nav className={styles.tabs}>
          {(['mine', 'users', 'groups'] as const).map((id) => (
            <button
              key={id}
              className={`${styles.tab}${tab === id ? ` ${styles.active}` : ''}`}
              onClick={() => setTab(id)}
            >
              {id === 'mine' ? 'My groups' : id === 'users' ? `Users (${allUsers.length})` : `All groups (${allGroups.length})`}
            </button>
          ))}
        </nav>
      )}

      <div className={styles.content}>
        {(!isAdmin || tab === 'mine') && (
          <MyGroupsView
            userId={me?.userId ?? ''}
            memberOf={memberOf}
            ownerOf={ownerOf}
            allUsers={isAdmin ? allUsers : []}
            isAdmin={isAdmin}
            onAddMember={addMember}
            onRemoveMember={removeMember}
            onDeleteGroup={deleteGroup}
          />
        )}
        {isAdmin && tab === 'users' && (
          <UsersTab users={allUsers} groups={allGroups} api={api} reload={reload} />
        )}
        {isAdmin && tab === 'groups' && (
          <AllGroupsTab
            groups={allGroups}
            allUsers={allUsers}
            api={api}
            reload={reload}
            onAddMember={addMember}
            onRemoveMember={removeMember}
            onDeleteGroup={deleteGroup}
          />
        )}
      </div>
    </div>
  );
};

// ── My Groups View ─────────────────────────────────────────────────────────────

interface MyGroupsViewProps {
  userId: string;
  memberOf: Group[];
  ownerOf: Group[];
  allUsers: User[];
  isAdmin: boolean;
  onAddMember: (gid: string, uid: string) => Promise<void>;
  onRemoveMember: (gid: string, uid: string) => Promise<void>;
  onDeleteGroup: (gid: string) => Promise<void>;
}

const MyGroupsView: React.FC<MyGroupsViewProps> = ({
  userId, memberOf, ownerOf, allUsers, isAdmin,
  onAddMember, onRemoveMember, onDeleteGroup,
}) => {
  const memberOnly = memberOf.filter((g) => !ownerOf.some((o) => o.id === g.id));

  return (
    <>
      {ownerOf.length === 0 && memberOf.length === 0 && (
        <p className={styles.empty}>You are not a member of any groups in this app.</p>
      )}
      {ownerOf.length > 0 && (
        <section>
          <h2 className={styles.sectionTitle}>Groups you own</h2>
          {ownerOf.map((g) => (
            <GroupCard key={g.id} group={g} allUsers={allUsers} isAdmin={isAdmin}
              canManage onAddMember={onAddMember} onRemoveMember={onRemoveMember}
              onDeleteGroup={onDeleteGroup} />
          ))}
        </section>
      )}
      {memberOnly.length > 0 && (
        <section>
          <h2 className={styles.sectionTitle}>Groups you belong to</h2>
          {memberOnly.map((g) => (
            <GroupCard key={g.id} group={g} allUsers={allUsers} isAdmin={isAdmin}
              canManage={isAdmin} onAddMember={onAddMember} onRemoveMember={onRemoveMember}
              onDeleteGroup={onDeleteGroup} />
          ))}
        </section>
      )}
    </>
  );
};

// ── Users Tab ─────────────────────────────────────────────────────────────────

interface UsersTabProps {
  users: User[];
  groups: Group[];
  api: <T>(method: string, path: string, body?: unknown) => Promise<T>;
  reload: () => void;
}

const UsersTab: React.FC<UsersTabProps> = ({ users, groups, api, reload }) => {
  const [editing, setEditing] = useState<string | null>(null);

  if (!users.length)
    return <p className={styles.empty}>No users yet. Create one with the MCP tools.</p>;

  return (
    <>
      {users.map((u) =>
        editing === u.id ? (
          <UserEditCard key={u.id} user={u} groups={groups}
            onCancel={() => setEditing(null)}
            onSave={async (roles, groupIds) => {
              await api('PATCH', `users/${u.id}/membership`, { roles, groupIds });
              setEditing(null);
              reload();
            }}
          />
        ) : (
          <div key={u.id} className={styles.card}>
            <div className={styles.cardMain}>
              <div className={styles.cardInfo}>
                <strong>{u.name}</strong>
                <span className={styles.uid}>{u.id}</span>
              </div>
              <div className={styles.cardRoles}>
                {(u.effectiveRoles ?? []).length > 0
                  ? (u.effectiveRoles ?? []).map((r) => (
                    <span key={r} className={`${styles.badge}${r === 'admin' ? ` ${styles.admin}` : ''}`}>{r}</span>
                  ))
                  : <span className={styles.noRoles}>No roles</span>}
              </div>
              <div className={styles.cardActions}>
                <button className={`${styles.btn} ${styles.ghost}`} onClick={() => setEditing(u.id)}>Edit…</button>
              </div>
            </div>
          </div>
        ),
      )}
    </>
  );
};

interface UserEditCardProps {
  user: User;
  groups: Group[];
  onCancel: () => void;
  onSave: (roles: string[], groupIds: string[]) => Promise<void>;
}

const UserEditCard: React.FC<UserEditCardProps> = ({ user, groups, onCancel, onSave }) => {
  const m = user.membership ?? { roles: [], groupIds: [] };
  const [rolesValue, setRolesValue] = useState((m.roles ?? []).join(', '));
  const [selectedGroups, setSelectedGroups] = useState(new Set(m.groupIds ?? []));
  const [busy, setBusy] = useState(false);

  const toggle = (gid: string) =>
    setSelectedGroups((prev) => {
      const next = new Set(prev);
      next.has(gid) ? next.delete(gid) : next.add(gid);
      return next;
    });

  const handleSave = async () => {
    setBusy(true);
    try {
      const roles = rolesValue.split(',').map((r) => r.trim()).filter(Boolean);
      await onSave(roles, [...selectedGroups]);
    } catch (e) {
      alert((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <div className={`${styles.card} ${styles.editing}`}>
      <div className={styles.editForm}>
        <div className={styles.editHdr}>
          <strong>{user.name}</strong> <span className={styles.uid}>{user.id}</span>
        </div>
        <div className={styles.field}>
          <label>Direct roles <small>(comma-separated)</small></label>
          <input value={rolesValue} onChange={(e) => setRolesValue(e.target.value)} placeholder="e.g. admin, editor" />
        </div>
        {groups.length > 0 && (
          <div className={styles.field}>
            <label>Group memberships</label>
            {groups.map((g) => (
              <label key={g.id} className={styles.chk}>
                <input type="checkbox" checked={selectedGroups.has(g.id)} onChange={() => toggle(g.id)} />
                {g.name}
                {g.roles.length > 0 && <span className={styles.uid}> ({g.roles.join(', ')})</span>}
              </label>
            ))}
          </div>
        )}
        <div className={styles.editActions}>
          <button className={`${styles.btn} ${styles.primary}`} disabled={busy} onClick={handleSave}>Save</button>
          <button className={`${styles.btn} ${styles.ghost}`} onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

// ── All Groups Tab ────────────────────────────────────────────────────────────

interface AllGroupsTabProps {
  groups: Group[];
  allUsers: User[];
  api: <T>(method: string, path: string, body?: unknown) => Promise<T>;
  reload: () => void;
  onAddMember: (gid: string, uid: string) => Promise<void>;
  onRemoveMember: (gid: string, uid: string) => Promise<void>;
  onDeleteGroup: (gid: string) => Promise<void>;
}

const AllGroupsTab: React.FC<AllGroupsTabProps> = ({
  groups, allUsers, api, reload, onAddMember, onRemoveMember, onDeleteGroup,
}) => {
  const [name, setName] = useState('');
  const [roles, setRoles] = useState('');
  const [busy, setBusy] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      const parsedRoles = roles.split(',').map((r) => r.trim()).filter(Boolean);
      await api('POST', 'groups', { name: name.trim(), roles: parsedRoles });
      setName('');
      setRoles('');
      reload();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className={styles.createGroup}>
        <form className={styles.createGroupForm} onSubmit={handleCreate}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Group name" required />
          <input value={roles} onChange={(e) => setRoles(e.target.value)} placeholder="Roles granted (comma-separated)" />
          <button type="submit" className={`${styles.btn} ${styles.primary}`} disabled={busy}>Create group</button>
        </form>
      </div>
      {groups.length === 0 && <p className={styles.empty}>No groups yet.</p>}
      {groups.map((g) => (
        <GroupCard key={g.id} group={g} allUsers={allUsers} isAdmin canManage
          onAddMember={onAddMember} onRemoveMember={onRemoveMember} onDeleteGroup={onDeleteGroup} />
      ))}
    </>
  );
};

export default AdminPage;
