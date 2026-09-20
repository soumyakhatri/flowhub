export type Role = "OWNER" | "ADMIN" | "MEMBER";

export type TaskStatus = "todo" | "in_progress" | "done";

export type TaskPriority = "low" | "medium" | "high";

export type User = {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Organization = {
  id: string;
  name: string;
  role?: Role;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Workspace = {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Project = {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Task = {
  id: string;
  projectId: string;
  workspaceId?: string;
  title: string;
  description?: string;
  status: TaskStatus | string;
  priority: TaskPriority | string;
  assigneeId?: string | null;
  dueDate?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type Comment = {
  id: string;
  taskId: string;
  authorId: string;
  authorName?: string;
  content: string;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateWorkspaceInput = {
  name: string;
  description?: string;
};

export type CreateProjectInput = {
  name: string;
  description?: string;
};

export type TaskInput = {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string | null;
  dueDate?: string | null;
};

export const TASK_STATUSES: { value: TaskStatus; label: string }[] = [
  { value: "todo", label: "To do" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
];

export const TASK_PRIORITIES: { value: TaskPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];