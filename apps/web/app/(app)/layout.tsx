import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { decodeToken } from '@/lib/auth';
import { api } from '@/lib/api';
import { Sidebar } from '@/components/layout/Sidebar';
import type { Workspace, User } from '@/lib/types';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) redirect('/login');

  const payload = decodeToken(token);
  if (!payload) redirect('/login');

  const [workspaces, user] = await Promise.all([
    api.get<Workspace[]>('/workspaces', token).catch(() => [] as Workspace[]),
    api.get<User>(`/users/${payload.sub}`, token).catch(() => null),
  ]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        workspaces={workspaces}
        email={payload.email}
        name={user?.name ?? undefined}
      />
      <main className="flex-1 overflow-y-auto bg-background">
        {children}
      </main>
    </div>
  );
}
