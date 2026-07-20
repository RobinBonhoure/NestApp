'use client';

import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MoreHorizontal, Plus, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TaskCard } from './TaskCard';
import { api } from '@/lib/api';
import type { Column, Task } from '@/lib/types';

interface KanbanColumnProps {
  column: Column;
  onTaskClick: (task: Task) => void;
  onTaskCreated: (columnId: string, task: Task) => void;
  onColumnDeleted: (columnId: string) => void;
}

export function KanbanColumn({ column, onTaskClick, onTaskCreated, onColumnDeleted }: KanbanColumnProps) {
  const [addingTask, setAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [creating, setCreating] = useState(false);

  const taskIds = column.tasks.map((t) => t.id);

  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: { type: 'column', column },
  });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: column.id,
    data: { type: 'column', columnId: column.id },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  async function createTask() {
    if (!newTaskTitle.trim()) return;
    setCreating(true);
    try {
      const task = await api.post<Task>('/tasks', {
        title: newTaskTitle.trim(),
        columnId: column.id,
      });
      onTaskCreated(column.id, task);
      setNewTaskTitle('');
      setAddingTask(false);
    } catch {
      // ignore
    } finally {
      setCreating(false);
    }
  }

  async function deleteColumn() {
    try {
      await api.delete(`/columns/${column.id}`);
      onColumnDeleted(column.id);
    } catch {
      // ignore
    }
  }

  if (isDragging) {
    return (
      <div
        ref={setSortableRef}
        style={style}
        className="w-72 shrink-0 rounded-xl border-2 border-dashed border-border bg-muted/20 h-40"
      />
    );
  }

  return (
    <div ref={setSortableRef} style={style} className="w-72 shrink-0 flex flex-col">
      {/* Column header */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-1.5">
          <button
            {...attributes}
            {...listeners}
            className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing p-0.5"
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold">{column.name}</span>
          <span className="text-xs text-muted-foreground bg-muted rounded-full px-1.5 py-0.5">
            {column.tasks.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={() => setAddingTask(true)}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger render={<button className="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors" />}>
              <MoreHorizontal className="h-3.5 w-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer" onClick={deleteColumn}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete column
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tasks */}
      <div
        ref={setDropRef}
        className={`flex-1 rounded-xl p-2 flex flex-col gap-2 min-h-24 transition-colors
          ${isOver ? 'bg-accent/50' : 'bg-muted/30'}
        `}
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {column.tasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={onTaskClick} />
          ))}
        </SortableContext>

        {/* Quick add task */}
        {addingTask ? (
          <div className="flex flex-col gap-1.5">
            <Input
              autoFocus
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Task title…"
              className="text-sm h-8"
              onKeyDown={(e) => {
                if (e.key === 'Enter') createTask();
                if (e.key === 'Escape') { setAddingTask(false); setNewTaskTitle(''); }
              }}
            />
            <div className="flex gap-1.5">
              <Button size="sm" className="h-7 text-xs flex-1" onClick={createTask} disabled={creating}>
                {creating ? 'Adding…' : 'Add task'}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                onClick={() => { setAddingTask(false); setNewTaskTitle(''); }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAddingTask(true)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground p-1.5 rounded-md hover:bg-accent/50 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add task
          </button>
        )}
      </div>
    </div>
  );
}
