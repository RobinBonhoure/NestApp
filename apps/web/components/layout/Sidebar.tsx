'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Settings, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserMenu } from './UserMenu';
import type { Workspace } from '@/lib/types';

interface SidebarProps {
  workspaces: Workspace[];
  email: string;
  name?: string;
}

export function Sidebar({ workspaces, email, name }: SidebarProps) {
  const pathname = usePathname();
  const currentWorkspaceId = pathname.match(/\/workspaces\/([^/]+)/)?.[1];

  return (
    <aside className="flex h-screen w-56 flex-col border-r bg-card">
      {/* Logo */}
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/workspaces" className="font-semibold text-sm tracking-tight">
          NestApp
        </Link>
      </div>

      {/* Workspaces list */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        <p className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Workspaces
        </p>

        {workspaces.map((ws) => {
          const isActive = currentWorkspaceId === ws.id;
          return (
            <div key={ws.id}>
              <Link
                href={`/workspaces/${ws.id}`}
                className={cn(
                  'flex items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors',
                  isActive
                    ? 'bg-accent text-accent-foreground font-medium'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <LayoutDashboard className="h-4 w-4 shrink-0" />
                  <span className="truncate">{ws.name}</span>
                </div>
                {isActive && <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
              </Link>

              {isActive && (
                <Link
                  href={`/workspaces/${ws.id}/settings`}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-2 py-1.5 text-xs ml-4 transition-colors',
                    pathname.endsWith('/settings')
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  )}
                >
                  <Settings className="h-3.5 w-3.5" />
                  Settings
                </Link>
              )}
            </div>
          );
        })}
      </nav>

      {/* User menu */}
      <div className="border-t p-2">
        <UserMenu email={email} name={name} />
      </div>
    </aside>
  );
}
