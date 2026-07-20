export type Priority = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST';
export type ProjectRole = 'ADMIN' | 'MEMBER' | 'VIEWER';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

// Shape returned by MEMBER_SELECT in workspace.service.ts
export interface WorkspaceMember {
  id: string;
  role: WorkspaceRole;
  joinedAt: string;
  user: User;
}

export interface WorkspaceWithMembers extends Workspace {
  members: WorkspaceMember[];
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  workspaceId: string;
  createdAt: string;
  boards?: Board[];
}

export interface Board {
  id: string;
  name: string;
  projectId: string;
  createdAt: string;
  columns?: Column[];
}

export interface Column {
  id: string;
  name: string;
  boardId: string;
  position: number;
  tasks: Task[];
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: Priority;
  position: number;
  columnId: string;
  reporterId: string;
  parentId: string | null;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  reporter: Pick<User, 'id' | 'name' | 'avatarUrl'>;
  assignees: { user: Pick<User, 'id' | 'name' | 'avatarUrl'> }[];
  labels: { label: Label }[];
  comments?: Comment[];
  subtasks?: Task[];
  _count?: { comments: number; subtasks: number };
}

export interface Label {
  id: string;
  name: string;
  color: string;
  projectId: string;
}

export interface Comment {
  id: string;
  content: string;
  taskId: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  author: Pick<User, 'id' | 'name' | 'avatarUrl'>;
}

export interface AuthResponse {
  access_token: string;
}

export interface TokenPayload {
  sub: string;
  email: string;
  iat: number;
  exp: number;
}
