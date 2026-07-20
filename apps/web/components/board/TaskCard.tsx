'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MessageSquare, GitBranch, Calendar, GripVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { Task } from '@/lib/types';

const PRIORITY_COLORS = {
  NONE: '',
  LOW: 'border-l-blue-400',
  MEDIUM: 'border-l-yellow-400',
  HIGH: 'border-l-orange-400',
  URGENT: 'border-l-red-500',
};

interface TaskCardProps {
  task: Task;
  onClick: (task: Task) => void;
  isDragOverlay?: boolean;
}

export function TaskCard({ task, onClick, isDragOverlay = false }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'task', task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (isDragging && !isDragOverlay) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="h-20 rounded-md border-2 border-dashed border-border bg-muted/30"
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative rounded-md border bg-card shadow-sm transition-shadow hover:shadow-md
        border-l-4 ${PRIORITY_COLORS[task.priority] || 'border-l-transparent'}
        ${isDragOverlay ? 'rotate-2 shadow-lg' : ''}
        ${task.completedAt ? 'opacity-60' : ''}
      `}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="absolute left-0 top-0 bottom-0 w-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground rounded-l-md"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>

      <button
        className="w-full text-left p-3 pl-5"
        onClick={() => onClick(task)}
      >
        <p className={`text-sm font-medium leading-snug ${task.completedAt ? 'line-through text-muted-foreground' : ''}`}>
          {task.title}
        </p>

        {/* Labels */}
        {task.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {task.labels.slice(0, 3).map(({ label }) => (
              <span
                key={label.id}
                className="inline-block h-1.5 w-8 rounded-full"
                style={{ backgroundColor: label.color }}
                title={label.name}
              />
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {(task._count?.comments ?? 0) > 0 && (
              <span className="flex items-center gap-0.5">
                <MessageSquare className="h-3 w-3" />
                {task._count!.comments}
              </span>
            )}
            {(task._count?.subtasks ?? 0) > 0 && (
              <span className="flex items-center gap-0.5">
                <GitBranch className="h-3 w-3" />
                {task._count!.subtasks}
              </span>
            )}
            {task.dueDate && (
              <span className="flex items-center gap-0.5">
                <Calendar className="h-3 w-3" />
                {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
            )}
          </div>

          {/* Assignees */}
          {task.assignees.length > 0 && (
            <div className="flex -space-x-1">
              {task.assignees.slice(0, 3).map(({ user }) => (
                <Avatar key={user.id} className="h-5 w-5 border border-card">
                  <AvatarFallback className="text-[9px]">
                    {user.name?.[0]?.toUpperCase() ?? '?'}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
          )}
        </div>
      </button>
    </div>
  );
}
