import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import { api } from '@/lib/api';
import { ProjectList } from '@/components/project/ProjectList';
import type { Workspace, Project } from '@/lib/types';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function WorkspacePage({ params }: Props) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) redirect('/login');

  const [workspace, projects] = await Promise.all([
    api.get<Workspace>(`/workspaces/${id}`, token).catch(() => null),
    api.get<Project[]>(`/projects?workspaceId=${id}`, token).catch(() => [] as Project[]),
  ]);

  if (!workspace) notFound();

  return (
    <ProjectList
      workspaceId={id}
      workspaceName={workspace.name}
      projects={projects}
    />
  );
}
