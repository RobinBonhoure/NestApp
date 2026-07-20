'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Trash2, Send, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/lib/api';
import type { Task, Comment, Label, User, Priority } from '@/lib/types';

const PRIORITY_LABELS: Record<Priority, string> = {
  NONE: 'No priority',
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
};

const PRIORITY_COLORS: Record<Priority, string> = {
  NONE: 'text-muted-foreground',
  LOW: 'text-blue-500',
  MEDIUM: 'text-yellow-500',
  HIGH: 'text-orange-500',
  URGENT: 'text-red-500',
};

interface TaskDetailModalProps {
  task: Task;
  projectId: string;
  onClose: () => void;
  onUpdated: (task: Task) => void;
  onDeleted: (taskId: string) => void;
}

export function TaskDetailModal({ task, projectId, onClose, onUpdated, onDeleted }: TaskDetailModalProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? '');
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [dueDate, setDueDate] = useState(task.dueDate ? task.dueDate.split('T')[0] : '');
  const [completed, setCompleted] = useState(!!task.completedAt);
  const [comments, setComments] = useState<Comment[]>(task.comments ?? []);
  const [labels, setLabels] = useState(task.labels);
  const [assignees, setAssignees] = useState(task.assignees);
  const [availableLabels, setAvailableLabels] = useState<Label[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [newComment, setNewComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [postingComment, setPostingComment] = useState(false);

  useEffect(() => {
    api.get<Label[]>(`/labels?projectId=${projectId}`).then(setAvailableLabels).catch(() => {});
    api.get<User[]>('/users').then(setAllUsers).catch(() => {});
  }, [projectId]);

  async function saveField(patch: Record<string, unknown>) {
    setSaving(true);
    try {
      const updated = await api.patch<Task>(`/tasks/${task.id}`, patch);
      onUpdated(updated);
    } catch {
      // revert handled by not updating local state on error
    } finally {
      setSaving(false);
    }
  }

  async function toggleComplete() {
    const next = !completed;
    setCompleted(next);
    await saveField({ completed: next });
  }

  async function handlePriorityChange(value: string) {
    setPriority(value as Priority);
    await saveField({ priority: value });
  }

  async function handleDueDateChange(value: string) {
    setDueDate(value);
    await saveField({ dueDate: value || null });
  }

  async function handleTitleBlur() {
    if (title !== task.title && title.trim()) {
      await saveField({ title: title.trim() });
    }
  }

  async function handleDescriptionBlur() {
    if (description !== (task.description ?? '')) {
      await saveField({ description: description || null });
    }
  }

  async function postComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;
    setPostingComment(true);
    try {
      const comment = await api.post<Comment>('/comments', { content: newComment.trim(), taskId: task.id });
      setComments((prev) => [...prev, comment]);
      setNewComment('');
    } catch {
      // ignore
    } finally {
      setPostingComment(false);
    }
  }

  async function deleteComment(commentId: string) {
    try {
      await api.delete(`/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch {
      // ignore
    }
  }

  async function toggleLabel(label: Label) {
    const attached = labels.some((l) => l.label.id === label.id);
    if (attached) {
      await api.delete(`/tasks/${task.id}/labels/${label.id}`).catch(() => {});
      setLabels((prev) => prev.filter((l) => l.label.id !== label.id));
    } else {
      const added = await api.post<{ label: Label }>(`/tasks/${task.id}/labels`, { labelId: label.id }).catch(() => null);
      if (added) setLabels((prev) => [...prev, added]);
    }
  }

  async function toggleAssignee(user: User) {
    const assigned = assignees.some((a) => a.user.id === user.id);
    if (assigned) {
      await api.delete(`/tasks/${task.id}/assignees/${user.id}`).catch(() => {});
      setAssignees((prev) => prev.filter((a) => a.user.id !== user.id));
    } else {
      await api.post(`/tasks/${task.id}/assignees`, { userId: user.id }).catch(() => {});
      setAssignees((prev) => [...prev, { user }]);
    }
  }

  async function deleteTask() {
    await api.delete(`/tasks/${task.id}`).catch(() => {});
    onDeleted(task.id);
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-start gap-3">
            <button
              onClick={toggleComplete}
              className={`mt-0.5 shrink-0 transition-colors ${completed ? 'text-green-500' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {completed ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
            </button>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              className="text-lg font-semibold border-none shadow-none p-0 h-auto focus-visible:ring-0"
            />
          </div>
        </DialogHeader>

        <div className="flex gap-0 divide-x">
          {/* Main content */}
          <div className="flex-1 p-6 pt-4 space-y-5 min-w-0">
            {/* Description */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Description</p>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleDescriptionBlur}
                placeholder="Add a description…"
                rows={4}
                className="resize-none text-sm"
              />
            </div>

            <Separator />

            {/* Comments */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-3">
                Comments ({comments.length})
              </p>

              <div className="space-y-3 mb-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="group flex gap-2.5">
                    <Avatar className="h-6 w-6 mt-0.5 shrink-0">
                      <AvatarFallback className="text-[9px]">
                        {comment.author.name?.[0]?.toUpperCase() ?? '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-xs font-medium">{comment.author.name ?? 'User'}</span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm mt-0.5 text-foreground/90">{comment.content}</p>
                    </div>
                    <button
                      onClick={() => deleteComment(comment.id)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all shrink-0"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <form onSubmit={postComment} className="flex gap-2">
                <Input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment…"
                  className="text-sm h-8 flex-1"
                />
                <Button type="submit" size="sm" className="h-8" disabled={postingComment || !newComment.trim()}>
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-56 shrink-0 p-4 space-y-4 text-sm">
            {/* Priority */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Priority</p>
              <Select value={priority} onValueChange={(v) => v && handlePriorityChange(v)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(PRIORITY_LABELS) as Priority[]).map((p) => (
                    <SelectItem key={p} value={p} className="text-xs">
                      <span className={PRIORITY_COLORS[p]}>{PRIORITY_LABELS[p]}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Due date */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Due date</p>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => handleDueDateChange(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            {/* Assignees */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Assignees</p>
              <div className="space-y-1">
                {allUsers.map((user) => {
                  const isAssigned = assignees.some((a) => a.user.id === user.id);
                  return (
                    <button
                      key={user.id}
                      onClick={() => toggleAssignee(user)}
                      className={`flex items-center gap-2 w-full rounded-md px-2 py-1 text-xs transition-colors
                        ${isAssigned ? 'bg-accent' : 'hover:bg-muted'}`}
                    >
                      <Avatar className="h-5 w-5">
                        <AvatarFallback className="text-[9px]">
                          {user.name?.[0]?.toUpperCase() ?? '?'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate">{user.name ?? user.email}</span>
                      {isAssigned && <span className="ml-auto text-green-500">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Labels */}
            {availableLabels.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">Labels</p>
                <div className="flex flex-wrap gap-1">
                  {availableLabels.map((label) => {
                    const attached = labels.some((l) => l.label.id === label.id);
                    return (
                      <button
                        key={label.id}
                        onClick={() => toggleLabel(label)}
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium transition-opacity
                          ${attached ? 'opacity-100 ring-2 ring-offset-1' : 'opacity-50 hover:opacity-80'}`}
                        style={{
                          backgroundColor: label.color + '33',
                          color: label.color,
                          outline: attached ? `2px solid ${label.color}` : 'none',
                          outlineOffset: '2px',
                        }}
                      >
                        {label.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Reporter */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Reporter</p>
              <div className="flex items-center gap-1.5">
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="text-[9px]">
                    {task.reporter.name?.[0]?.toUpperCase() ?? '?'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs truncate">{task.reporter.name ?? 'Unknown'}</span>
              </div>
            </div>

            <Separator />

            {/* Delete */}
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 text-xs"
              onClick={deleteTask}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Delete task
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
