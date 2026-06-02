import React from 'react';
import type { Group, User } from './types';
import styles from './admin-page.module.scss';

interface GroupCardProps {
    group: Group;
    allUsers: User[];
    isAdmin: boolean;
    canManage: boolean; // member of owners list or is admin
    onAddMember: (groupId: string, userId: string) => Promise<void>;
    onRemoveMember: (groupId: string, memberId: string) => Promise<void>;
    onDeleteGroup?: (groupId: string) => Promise<void>;
}

export const GroupCard: React.FC<GroupCardProps> = ({
    group,
    allUsers,
    isAdmin,
    canManage,
    onAddMember,
    onRemoveMember,
    onDeleteGroup,
}) => {
    const [addUserId, setAddUserId] = React.useState('');
    const [busy, setBusy] = React.useState(false);

    const userMembers = group.members.filter((m) => m.type === 'user');
    const notInGroup = allUsers.filter((u) => !userMembers.some((m) => m.id === u.id));

    React.useEffect(() => {
        if (notInGroup.length > 0 && !addUserId) setAddUserId(notInGroup[0].id);
    }, [notInGroup.length]); // eslint-disable-line react-hooks/exhaustive-deps

    const run = async (fn: () => Promise<void>) => {
        setBusy(true);
        try { await fn(); } catch (e) { alert((e as Error).message); }
        finally { setBusy(false); }
    };

    return (
        <div className={styles.card}>
            <div className={styles.cardMain}>
                <div className={styles.cardInfo}>
                    <strong>{group.name}</strong>
                    {group.roles.length > 0 && (
                        <span className={styles.uid}>grants: {group.roles.join(', ')}</span>
                    )}
                </div>
                {isAdmin && onDeleteGroup && (
                    <div className={styles.cardActions}>
                        <button
                            className={`${styles.btn} ${styles.ghost} ${styles.danger} ${styles.sm}`}
                            disabled={busy}
                            onClick={() => run(() => onDeleteGroup(group.id))}
                        >
                            Delete group
                        </button>
                    </div>
                )}
            </div>

            <div className={styles.members}>
                {userMembers.length === 0 && (
                    <span className={styles.noRoles}>No members</span>
                )}
                {userMembers.map((m) => {
                    const user = allUsers.find((u) => u.id === m.id);
                    return (
                        <div key={m.id} className={styles.memberRow}>
                            <span>
                                {user?.name ?? m.id}
                                <span className={styles.uid}> {m.id}</span>
                            </span>
                            {canManage && (
                                <button
                                    className={`${styles.btn} ${styles.ghost} ${styles.danger} ${styles.sm}`}
                                    disabled={busy}
                                    onClick={() => run(() => onRemoveMember(group.id, m.id))}
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                    );
                })}

                {canManage && notInGroup.length > 0 && (
                    <form
                        className={styles.addForm}
                        onSubmit={(e) => {
                            e.preventDefault();
                            run(() => onAddMember(group.id, addUserId));
                        }}
                    >
                        <select value={addUserId} onChange={(e) => setAddUserId(e.target.value)}>
                            {notInGroup.map((u) => (
                                <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                        </select>
                        <button
                            type="submit"
                            className={`${styles.btn} ${styles.ghost} ${styles.sm}`}
                            disabled={busy}
                        >
                            Add user
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};
