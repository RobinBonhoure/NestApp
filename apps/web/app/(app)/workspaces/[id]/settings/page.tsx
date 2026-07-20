import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import { api } from '@/lib/api';
import { decodeToken } from '@/lib/auth';
import { WorkspaceSettings } from '@/components/workspace/WorkspaceSettings';
import type { WorkspaceWithMembers } from '@/lib/types';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function WorkspaceSettingsPage({ params }: Props) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) redirect('/login');

  const payload = decodeToken(token);
  if (!payload) redirect('/login');

  const workspace = await api.get<WorkspaceWithMembers>(`/workspaces/${id}`, token).catch(() => null);
  if (!workspace) notFound();

  const myMembership = workspace.members.find((m) => m.user.id === payload.sub);
  const canManage = myMembership?.role === 'OWNER' || myMembership?.role === 'ADMIN';

  return (
    <WorkspaceSettings
      workspace={workspace}
      members={workspace.members}
      canManage={canManage}
      currentUserId={payload.sub}
    />
  );
}
