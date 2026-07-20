'use client';

import Link from 'next/link';
import { LayoutDashboard, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreateWorkspaceDialog } from './CreateWorkspaceDialog';
import type { Workspace } from '@/lib/types';

interface WorkspaceGridProps {
  workspaces: Workspace[];
}

export function WorkspaceGrid({ workspaces }: WorkspaceGridProps) {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Workspaces</h1>
          <p className="text-muted-foreground text-sm mt-1">Select a workspace to view its projects.</p>
        </div>
        <CreateWorkspaceDialog />
      </div>

      {workspaces.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-16 text-center">
          <LayoutDashboard className="h-10 w-10 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">No workspaces yet</p>
          <p className="text-sm text-muted-foreground mt-1 mb-6">
            Create your first workspace to get started.
          </p>
          <CreateWorkspaceDialog />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {workspaces.map((ws) => (
            <Card key={ws.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                  {ws.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">/{ws.slug}</p>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" size="sm" className="ml-auto" render={<Link href={`/workspaces/${ws.id}`} />}>
                  Open <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
