import type { Comment } from "../types";
import { ApiError, api, mapList, normalizeComment } from "./client";
import { unwrapEntity } from "./parse";

export const commentKeys = {
  list: (taskId: string) => ["comments", taskId] as const,
};

export function listComments(taskId: string) {
  return api<unknown>(
    `/tasks/${encodeURIComponent(taskId)}/comments?page=1&limit=100`,
  ).then((body) => mapList(body, normalizeComment));
}

export async function createComment(taskId: string, content: string): Promise<Comment> {
  const body = await api<unknown>(`/tasks/${encodeURIComponent(taskId)}/comments`, {
    method: "POST",
    body: { content },
  });
  const comment = normalizeComment(unwrapEntity(body, "comment"));
  if (!comment) throw new ApiError("Comment response was empty", 500, "BAD_RESPONSE");
  return comment;
}