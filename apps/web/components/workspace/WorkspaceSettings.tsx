'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, UserMinus, Crown, Shield, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/lib/api';
import type { Workspace, WorkspaceMember, WorkspaceWithMembers, WorkspaceRole } from '@/lib/types';

const ROLE_ICONS: Record<WorkspaceRole, React.ReactNode> = {
  OWNER: <Crown className="h-3.5 w-3.5" />,
  ADMIN: <Shield className="h-3.5 w-3.5" />,
  MEMBER: <User className="h-3.5 w-3.5" />,
  GUEST: <User className="h-3.5 w-3.5" />,
};

const ROLE_COLORS: Record<WorkspaceRole, string> = {
  OWNER: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  ADMIN: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  MEMBER: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  GUEST: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
};

interface WorkspaceSettingsProps {
  workspace: WorkspaceWithMembers;
  members: WorkspaceMember[];
  canManage: boolean | undefined;
  currentUserId: string;
}

export function WorkspaceSettings({ workspace, members: initialMembers, canManage, currentUserId }: WorkspaceSettingsProps) {
  const router = useRouter();
  const [members, setMembers] = useState(initialMembers);
  const [wsName, setWsName] = useState(workspace.name);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<WorkspaceRole>('MEMBER');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [inviting, setInviting] = useState(false);

  async function saveWorkspaceName(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.patch(`/workspaces/${workspace.id}`, { name: wsName });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setSaving(false);
    }
  }

  async function inviteMember(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    setError(null);
    try {
      const newMember = await api.post<WorkspaceMember>(`/workspaces/${workspace.id}/members`, {
        email: inviteEmail,
        role: inviteRole,
      });
      setMembers((prev) => [...prev, newMember]);
      setInviteEmail('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to invite');
    } finally {
      setInviting(false);
    }
  }

  async function changeRole(userId: string, role: WorkspaceRole) {
    try {
      const updated = await api.patch<WorkspaceMember>(`/workspaces/${workspace.id}/members/${userId}`, { role });
      setMembers((prev) => prev.map((m) => (m.user.id === userId ? updated : m)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change role');
    }
  }

  async function removeMember(userId: string) {
    try {
      await api.delete(`/workspaces/${workspace.id}/members/${userId}`);
      setMembers((prev) => prev.filter((m) => m.user.id !== userId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member');
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Workspace settings</h1>
        <p className="text-muted-foreground text-sm mt-1">{workspace.slug}</p>
      </div>

      {/* General */}
      <section>
        <h2 className="text-sm font-medium mb-3">General</h2>
        <form onSubmit={saveWorkspaceName} className="flex gap-3">
          <Input
            value={wsName}
            onChange={(e) => setWsName(e.target.value)}
            className="max-w-xs"
            disabled={!canManage}
            minLength={2}
            maxLength={50}
          />
          {canManage && (
            <Button type="submit" size="sm" disabled={saving || wsName === workspace.name}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          )}
        </form>
      </section>

      <Separator />

      {/* Members */}
      <section className="space-y-4">
        <h2 className="text-sm font-medium">Members ({members.length})</h2>

        {canManage && (
          <form onSubmit={inviteMember} className="flex gap-2">
            <Input
              type="email"
              placeholder="Invite by email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
              className="flex-1"
            />
            <Select value={inviteRole} onValueChange={(v) => v && setInviteRole(v as WorkspaceRole)}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="MEMBER">Member</SelectItem>
                <SelectItem value="GUEST">Guest</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" size="sm" disabled={inviting}>
              {inviting ? 'Inviting…' : 'Invite'}
            </Button>
          </form>
        )}

        <div className="space-y-1">
          {members.map((member) => (
            <div key={member.user.id} className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-muted/50">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {member.user.name?.[0]?.toUpperCase() ?? member.user.email[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{member.user.name ?? member.user.email}</p>
                <p className="text-xs text-muted-foreground truncate">{member.user.email}</p>
              </div>

              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[member.role]}`}
              >
                {ROLE_ICONS[member.role]}
                {member.role}
              </span>

              {canManage && member.role !== 'OWNER' && member.user.id !== currentUserId && (
                <div className="flex items-center gap-1">
                  <Select
                    value={member.role}
                    onValueChange={(v) => v && changeRole(member.user.id, v as WorkspaceRole)}
                  >
                    <SelectTrigger className="h-7 w-24 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="MEMBER">Member</SelectItem>
                      <SelectItem value="GUEST">Guest</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => removeMember(member.user.id)}
                  >
                    <UserMinus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
