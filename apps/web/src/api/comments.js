import { ApiError, api, mapList, normalizeComment } from "./client";
import { unwrapEntity } from "./parse";
const commentKeys = {
  list: (taskId) => ["comments", taskId]
};
function listComments(taskId) {
  return api(
    `/tasks/${encodeURIComponent(taskId)}/comments?page=1&limit=100`
  ).then((body) => mapList(body, normalizeComment));
}
async function createComment(taskId, content) {
  const body = await api(`/tasks/${encodeURIComponent(taskId)}/comments`, {
    method: "POST",
    body: { content }
  });
  const comment = normalizeComment(unwrapEntity(body, "comment"));
  if (!comment) throw new ApiError("Comment response was empty", 500, "BAD_RESPONSE");
  return comment;
}
export {
  commentKeys,
  createComment,
  listComments
};
