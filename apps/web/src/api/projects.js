import { ApiError, api, mapList, normalizeProject } from "./client";
import { unwrapEntity } from "./parse";
const projectKeys = {
  list: (workspaceId) => ["projects", workspaceId],
  detail: (id) => ["project", id]
};
function listProjects(workspaceId) {
  return api(
    `/workspaces/${encodeURIComponent(workspaceId)}/projects?page=1&limit=100`
  ).then((body) => mapList(body, normalizeProject));
}
async function getProject(id) {
  const body = await api(`/projects/${encodeURIComponent(id)}`);
  const project = normalizeProject(unwrapEntity(body, "project"));
  if (!project) throw new ApiError("Project not found", 404, "NOT_FOUND");
  return project;
}
async function createProject(workspaceId, input) {
  const body = await api(`/workspaces/${encodeURIComponent(workspaceId)}/projects`, {
    method: "POST",
    body: {
      name: input.name,
      ...input.description ? { description: input.description } : {}
    }
  });
  const project = normalizeProject(unwrapEntity(body, "project"));
  if (!project) throw new ApiError("Project response was empty", 500, "BAD_RESPONSE");
  return project;
}
export {
  createProject,
  getProject,
  listProjects,
  projectKeys
};
