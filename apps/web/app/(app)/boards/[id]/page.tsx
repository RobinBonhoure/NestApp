import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import { api } from '@/lib/api';
import { KanbanBoard } from '@/components/board/KanbanBoard';
import type { Board, Column } from '@/lib/types';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function BoardPage({ params }: Props) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) redirect('/login');

  const board = await api.get<Board & { columns: Column[] }>(`/boards/${id}`, token).catch(() => null);
  if (!board) notFound();

  return <KanbanBoard board={board} />;
}
