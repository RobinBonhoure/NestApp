import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import { api } from '@/lib/api';
import type { Project, Board } from '@/lib/types';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProjectPage({ params }: Props) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) redirect('/login');

  const project = await api
    .get<Project & { boards: Board[] }>(`/projects/${id}`, token)
    .catch(() => null);

  if (!project) notFound();

  const firstBoard = project.boards?.[0];
  if (firstBoard) redirect(`/boards/${firstBoard.id}`);

  // Project exists but has no board yet — show a simple placeholder
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <h1 className="text-xl font-semibold mb-2">{project.name}</h1>
      <p className="text-muted-foreground">This project has no boards yet.</p>
    </div>
  );
}
