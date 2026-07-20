'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { api } from '@/lib/api';

interface CreateProjectDialogProps {
  workspaceId: string;
}

function toKey(name: string): string {
  return name
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, '')
    .split(/\s+/)
    .map((w) => w.slice(0, 2))
    .join('')
    .slice(0, 6) || 'PROJ';
}

export function CreateProjectDialog({ workspaceId }: CreateProjectDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [keyEdited, setKeyEdited] = useState(false);

  function handleNameChange(value: string) {
    setName(value);
    if (!keyEdited) setKey(toKey(value));
  }

  function handleKeyChange(value: string) {
    setKey(value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6));
    setKeyEdited(true);
  }

  function handleOpen(isOpen: boolean) {
    setOpen(isOpen);
    if (!isOpen) {
      setName('');
      setKey('');
      setKeyEdited(false);
      setError(null);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      const project = await api.post<{ id: string; boards?: { id: string }[] }>(
        '/projects',
        {
          name: fd.get('name'),
          key,
          description: (fd.get('description') as string) || undefined,
          workspaceId,
        },
      );
      setOpen(false);
      const boardId = project.boards?.[0]?.id;
      if (boardId) {
        router.push(`/boards/${boardId}`);
      } else {
        router.push(`/projects/${project.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        New project
      </Button>

      <Dialog open={open} onOpenChange={handleOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Create project</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="proj-name">Name</Label>
              <Input
                id="proj-name"
                name="name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="My project"
                required
                minLength={2}
                maxLength={50}
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="proj-key">
                Key{' '}
                <span className="text-xs text-muted-foreground font-normal">(2-6 uppercase letters)</span>
              </Label>
              <Input
                id="proj-key"
                name="key"
                value={key}
                onChange={(e) => handleKeyChange(e.target.value)}
                placeholder="PROJ"
                required
                minLength={2}
                maxLength={6}
                className="font-mono"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="proj-desc">Description (optional)</Label>
              <Input id="proj-desc" name="description" placeholder="What is this project about?" maxLength={500} />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || key.length < 2}>
                {loading ? 'Creating…' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
