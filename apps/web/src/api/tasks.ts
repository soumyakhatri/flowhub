import type { Task, TaskInput } from "../types";
import { ApiError, api, mapList, normalizeTask } from "./client";
import { unwrapEntity } from "./parse";

export const taskKeys = {
  list: (projectId: string) => ["tasks", projectId] as const,
  detail: (id: string) => ["task", id] as const,
};

export function listTasks(projectId: string) {
  return api<unknown>(
    `/projects/${encodeURIComponent(projectId)}/tasks?page=1&limit=100`,
  ).then((body) => mapList(body, normalizeTask));
}

export async function getTask(id: string): Promise<Task> {
  const body = await api<unknown>(`/tasks/${encodeURIComponent(id)}`);
  const task = normalizeTask(unwrapEntity(body, "task"));
  if (!task) throw new ApiError("Task not found", 404, "NOT_FOUND");
  return task;
}

export async function createTask(projectId: string, input: TaskInput): Promise<Task> {
  const body = await api<unknown>(`/projects/${encodeURIComponent(projectId)}/tasks`, {
    method: "POST",
    body: input,
  });
  const task = normalizeTask(unwrapEntity(body, "task"));
  if (!task) throw new ApiError("Task response was empty", 500, "BAD_RESPONSE");
  return task;
}

export async function updateTask(id: string, input: Partial<TaskInput>): Promise<Task> {
  const body = await api<unknown>(`/tasks/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: input,
  });
  const task = normalizeTask(unwrapEntity(body, "task"));
  if (!task) throw new ApiError("Task response was empty", 500, "BAD_RESPONSE");
  return task;
}

export function deleteTask(id: string) {
  return api<void>(`/tasks/${encodeURIComponent(id)}`, { method: "DELETE" });
}