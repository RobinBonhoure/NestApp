'use client';

import Link from 'next/link';
import { Kanban, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreateProjectDialog } from './CreateProjectDialog';
import type { Project } from '@/lib/types';

interface ProjectListProps {
  workspaceId: string;
  workspaceName: string;
  projects: Project[];
}

export function ProjectList({ workspaceId, workspaceName, projects }: ProjectListProps) {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">{workspaceName}</h1>
          <p className="text-muted-foreground text-sm mt-1">Projects in this workspace</p>
        </div>
        <CreateProjectDialog workspaceId={workspaceId} />
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-16 text-center">
          <Kanban className="h-10 w-10 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">No projects yet</p>
          <p className="text-sm text-muted-foreground mt-1 mb-6">
            Create your first project to start tracking work.
          </p>
          <CreateProjectDialog workspaceId={workspaceId} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => {
            return (
              <Card key={project.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Kanban className="h-4 w-4 text-muted-foreground" />
                    {project.name}
                  </CardTitle>
                </CardHeader>
                {project.description && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                  </CardContent>
                )}
                <CardFooter>
                  <Button variant="ghost" size="sm" className="ml-auto" render={<Link href={`/projects/${project.id}`} />}>
                    Open board <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
