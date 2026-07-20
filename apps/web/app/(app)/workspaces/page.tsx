import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { api } from '@/lib/api';
import { WorkspaceGrid } from '@/components/workspace/WorkspaceGrid';
import type { Workspace } from '@/lib/types';

export default async function WorkspacesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) redirect('/login');

  const workspaces = await api.get<Workspace[]>('/workspaces', token).catch(() => [] as Workspace[]);

  return <WorkspaceGrid workspaces={workspaces} />;
}
