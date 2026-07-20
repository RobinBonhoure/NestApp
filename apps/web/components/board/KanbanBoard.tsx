'use client';

import { useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { CreateColumnDialog } from './CreateColumnDialog';
import { KanbanColumn } from './KanbanColumn';
import { TaskCard } from './TaskCard';
import { TaskDetailModal } from './TaskDetailModal';
import { api } from '@/lib/api';
import type { Board, Column, Task } from '@/lib/types';

interface KanbanBoardProps {
  board: Board & { columns: Column[] };
}

export function KanbanBoard({ board: initialBoard }: KanbanBoardProps) {
  const [columns, setColumns] = useState<Column[]>(initialBoard.columns);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [activeColumn, setActiveColumn] = useState<Column | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const columnIds = columns.map((c) => c.id);

  function findColumnOfTask(taskId: string): Column | undefined {
    return columns.find((c) => c.tasks.some((t) => t.id === taskId));
  }

  function findColumnById(id: string): Column | undefined {
    return columns.find((c) => c.id === id);
  }

  function onDragStart({ active }: DragStartEvent) {
    const type = active.data.current?.type as string;
    if (type === 'column') {
      setActiveColumn(active.data.current?.column as Column);
    } else if (type === 'task') {
      setActiveTask(active.data.current?.task as Task);
    }
  }

  function onDragOver({ active, over }: DragOverEvent) {
    if (!over || active.id === over.id) return;
    const activeType = active.data.current?.type as string;
    if (activeType !== 'task') return;

    const activeColumnSrc = findColumnOfTask(active.id as string);
    if (!activeColumnSrc) return;

    // Determine target column
    const overType = over.data.current?.type as string;
    const targetColumnId = overType === 'column'
      ? (over.id as string)
      : (over.data.current?.task as Task | undefined)
        ? findColumnOfTask(over.id as string)?.id
        : undefined;

    if (!targetColumnId || targetColumnId === activeColumnSrc.id) return;

    // Move the task between columns in local state for visual feedback
    setColumns((prev) => {
      const srcIdx = prev.findIndex((c) => c.id === activeColumnSrc.id);
      const dstIdx = prev.findIndex((c) => c.id === targetColumnId);
      if (srcIdx === -1 || dstIdx === -1) return prev;

      const task = prev[srcIdx].tasks.find((t) => t.id === active.id);
      if (!task) return prev;

      const next = prev.map((col, i) => {
        if (i === srcIdx) return { ...col, tasks: col.tasks.filter((t) => t.id !== active.id) };
        if (i === dstIdx) {
          const overTaskIdx = col.tasks.findIndex((t) => t.id === over.id);
          const newTasks = [...col.tasks];
          const insertAt = overTaskIdx >= 0 ? overTaskIdx : newTasks.length;
          newTasks.splice(insertAt, 0, { ...task, columnId: targetColumnId });
          return { ...col, tasks: newTasks };
        }
        return col;
      });
      return next;
    });
  }

  async function onDragEnd({ active, over }: DragEndEvent) {
    setActiveTask(null);
    setActiveColumn(null);

    if (!over || active.id === over.id) return;

    const activeType = active.data.current?.type as string;

    if (activeType === 'column') {
      const oldIdx = columns.findIndex((c) => c.id === active.id);
      const newIdx = columns.findIndex((c) => c.id === over.id);
      if (oldIdx === newIdx) return;
      const reordered = arrayMove(columns, oldIdx, newIdx);
      setColumns(reordered);
      api.patch(`/columns/reorder/${initialBoard.id}`, { columnIds: reordered.map((c) => c.id) }).catch(() => {});
      return;
    }

    if (activeType === 'task') {
      const srcColumn = columns.find((c) => c.tasks.some((t) => t.id === active.id));
      if (!srcColumn) return;

      const overType = over.data.current?.type as string;
      const targetColumnId = overType === 'column'
        ? (over.id as string)
        : findColumnOfTask(over.id as string)?.id ?? srcColumn.id;

      const targetColumn = findColumnById(targetColumnId);
      if (!targetColumn) return;

      if (srcColumn.id === targetColumnId) {
        // Same column — reorder
        const oldIdx = srcColumn.tasks.findIndex((t) => t.id === active.id);
        const newIdx = targetColumn.tasks.findIndex((t) => t.id === over.id);
        if (oldIdx === newIdx) return;
        const reorderedTasks = arrayMove(srcColumn.tasks, oldIdx, newIdx);
        setColumns((prev) =>
          prev.map((c) => (c.id === srcColumn.id ? { ...c, tasks: reorderedTasks } : c)),
        );
        api.patch(`/tasks/reorder/${srcColumn.id}`, { taskIds: reorderedTasks.map((t) => t.id) }).catch(() => {});
      } else {
        // Cross-column move — position already updated in onDragOver; just call API
        const position = targetColumn.tasks.findIndex((t) => t.id === active.id);
        api.patch(`/tasks/${active.id}/move`, { columnId: targetColumnId, position: Math.max(0, position) }).catch(() => {});
      }
    }
  }

  const handleTaskClick = useCallback((task: Task) => {
    setSelectedTask(task);
  }, []);

  const handleTaskUpdated = useCallback((updated: Task) => {
    setColumns((prev) =>
      prev.map((col) => ({
        ...col,
        tasks: col.tasks.map((t) => (t.id === updated.id ? updated : t)),
      })),
    );
    setSelectedTask(updated);
  }, []);

  const handleTaskDeleted = useCallback((taskId: string) => {
    setColumns((prev) =>
      prev.map((col) => ({ ...col, tasks: col.tasks.filter((t) => t.id !== taskId) })),
    );
    setSelectedTask(null);
  }, []);

  const handleColumnCreated = useCallback((column: Column) => {
    setColumns((prev) => [...prev, column]);
  }, []);

  const handleColumnDeleted = useCallback((columnId: string) => {
    setColumns((prev) => prev.filter((c) => c.id !== columnId));
  }, []);

  const handleTaskCreated = useCallback((columnId: string, task: Task) => {
    setColumns((prev) =>
      prev.map((col) => col.id === columnId ? { ...col, tasks: [...col.tasks, task] } : col),
    );
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Board header */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <h1 className="text-lg font-semibold">{initialBoard.name}</h1>
        <CreateColumnDialog boardId={initialBoard.id} onCreated={handleColumnCreated} />
      </div>

      {/* Columns area */}
      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-4 p-6 h-full items-start min-w-max">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
          >
            <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
              {columns.map((column) => (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  onTaskClick={handleTaskClick}
                  onTaskCreated={handleTaskCreated}
                  onColumnDeleted={handleColumnDeleted}
                />
              ))}
            </SortableContext>

            <DragOverlay>
              {activeColumn && (
                <div className="w-72 opacity-90">
                  <KanbanColumn
                    column={activeColumn}
                    onTaskClick={() => {}}
                    onTaskCreated={() => {}}
                    onColumnDeleted={() => {}}
                  />
                </div>
              )}
              {activeTask && (
                <TaskCard task={activeTask} onClick={() => {}} isDragOverlay />
              )}
            </DragOverlay>
          </DndContext>
        </div>
      </div>

      {/* Task detail modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          projectId={initialBoard.projectId}
          onClose={() => setSelectedTask(null)}
          onUpdated={handleTaskUpdated}
          onDeleted={handleTaskDeleted}
        />
      )}
    </div>
  );
}
