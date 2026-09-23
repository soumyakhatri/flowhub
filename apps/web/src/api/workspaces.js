import { ApiError, api, mapList, normalizeWorkspace } from "./client";
import { unwrapEntity } from "./parse";
const workspaceKeys = {
  list: (orgId) => ["workspaces", orgId],
  detail: (id) => ["workspace", id]
};
function listWorkspaces(orgId) {
  return api(
    `/organizations/${encodeURIComponent(orgId)}/workspaces?page=1&limit=100`
  ).then((body) => mapList(body, normalizeWorkspace));
}
async function getWorkspace(id) {
  const body = await api(`/workspaces/${encodeURIComponent(id)}`);
  const workspace = normalizeWorkspace(unwrapEntity(body, "workspace"));
  if (!workspace) throw new ApiError("Workspace not found", 404, "NOT_FOUND");
  return workspace;
}
async function createWorkspace(orgId, input) {
  const body = await api(`/organizations/${encodeURIComponent(orgId)}/workspaces`, {
    method: "POST",
    body: {
      name: input.name,
      ...input.description ? { description: input.description } : {}
    }
  });
  const workspace = normalizeWorkspace(unwrapEntity(body, "workspace"));
  if (!workspace) throw new ApiError("Workspace response was empty", 500, "BAD_RESPONSE");
  return workspace;
}
export {
  createWorkspace,
  getWorkspace,
  listWorkspaces,
  workspaceKeys
};
