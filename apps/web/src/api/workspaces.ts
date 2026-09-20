import type { CreateWorkspaceInput, Workspace } from "../types";
import { ApiError, api, mapList, normalizeWorkspace } from "./client";
import { unwrapEntity } from "./parse";

export const workspaceKeys = {
  list: (orgId: string) => ["workspaces", orgId] as const,
  detail: (id: string) => ["workspace", id] as const,
};

export function listWorkspaces(orgId: string) {
  return api<unknown>(
    `/organizations/${encodeURIComponent(orgId)}/workspaces?page=1&limit=100`,
  ).then((body) => mapList(body, normalizeWorkspace));
}

export async function getWorkspace(id: string): Promise<Workspace> {
  const body = await api<unknown>(`/workspaces/${encodeURIComponent(id)}`);
  const workspace = normalizeWorkspace(unwrapEntity(body, "workspace"));
  if (!workspace) throw new ApiError("Workspace not found", 404, "NOT_FOUND");
  return workspace;
}

export async function createWorkspace(orgId: string, input: CreateWorkspaceInput): Promise<Workspace> {
  const body = await api<unknown>(`/organizations/${encodeURIComponent(orgId)}/workspaces`, {
    method: "POST",
    body: {
      name: input.name,
      ...(input.description ? { description: input.description } : {}),
    },
  });
  const workspace = normalizeWorkspace(unwrapEntity(body, "workspace"));
  if (!workspace) throw new ApiError("Workspace response was empty", 500, "BAD_RESPONSE");
  return workspace;
}