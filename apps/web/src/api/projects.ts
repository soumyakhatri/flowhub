import type { CreateProjectInput, Project } from "../types";
import { ApiError, api, mapList, normalizeProject } from "./client";
import { unwrapEntity } from "./parse";

export const projectKeys = {
  list: (workspaceId: string) => ["projects", workspaceId] as const,
  detail: (id: string) => ["project", id] as const,
};

export function listProjects(workspaceId: string) {
  return api<unknown>(
    `/workspaces/${encodeURIComponent(workspaceId)}/projects?page=1&limit=100`,
  ).then((body) => mapList(body, normalizeProject));
}

export async function getProject(id: string): Promise<Project> {
  const body = await api<unknown>(`/projects/${encodeURIComponent(id)}`);
  const project = normalizeProject(unwrapEntity(body, "project"));
  if (!project) throw new ApiError("Project not found", 404, "NOT_FOUND");
  return project;
}

export async function createProject(workspaceId: string, input: CreateProjectInput): Promise<Project> {
  const body = await api<unknown>(`/workspaces/${encodeURIComponent(workspaceId)}/projects`, {
    method: "POST",
    body: {
      name: input.name,
      ...(input.description ? { description: input.description } : {}),
    },
  });
  const project = normalizeProject(unwrapEntity(body, "project"));
  if (!project) throw new ApiError("Project response was empty", 500, "BAD_RESPONSE");
  return project;
}