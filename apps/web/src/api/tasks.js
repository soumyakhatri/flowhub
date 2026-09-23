import { ApiError, api, mapList, normalizeTask } from "./client";
import { unwrapEntity } from "./parse";
const taskKeys = {
  list: (projectId) => ["tasks", projectId],
  detail: (id) => ["task", id]
};
function listTasks(projectId) {
  return api(
    `/projects/${encodeURIComponent(projectId)}/tasks?page=1&limit=100`
  ).then((body) => mapList(body, normalizeTask));
}
async function getTask(id) {
  const body = await api(`/tasks/${encodeURIComponent(id)}`);
  const task = normalizeTask(unwrapEntity(body, "task"));
  if (!task) throw new ApiError("Task not found", 404, "NOT_FOUND");
  return task;
}
async function createTask(projectId, input) {
  const body = await api(`/projects/${encodeURIComponent(projectId)}/tasks`, {
    method: "POST",
    body: input
  });
  const task = normalizeTask(unwrapEntity(body, "task"));
  if (!task) throw new ApiError("Task response was empty", 500, "BAD_RESPONSE");
  return task;
}
async function updateTask(id, input) {
  const body = await api(`/tasks/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: input
  });
  const task = normalizeTask(unwrapEntity(body, "task"));
  if (!task) throw new ApiError("Task response was empty", 500, "BAD_RESPONSE");
  return task;
}
function deleteTask(id) {
  return api(`/tasks/${encodeURIComponent(id)}`, { method: "DELETE" });
}
export {
  createTask,
  deleteTask,
  getTask,
  listTasks,
  taskKeys,
  updateTask
};
