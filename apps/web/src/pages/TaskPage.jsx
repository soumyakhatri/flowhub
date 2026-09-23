import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { errorMessage } from "../api/client";
import { commentKeys, createComment, listComments } from "../api/comments";
import { getOrganization, organizationKeys } from "../api/organizations";
import { getProject, projectKeys } from "../api/projects";
import { deleteTask, getTask, taskKeys, updateTask } from "../api/tasks";
import { getWorkspace, workspaceKeys } from "../api/workspaces";
import {
  Alert,
  Breadcrumbs,
  Button,
  EmptyState,
  Field,
  PageHeader,
  Panel,
  SelectInput,
  Spinner,
  TextArea,
  TextInput
} from "../components/ui";
import { useAuth } from "../hooks/useAuth";
import { formatWhen, fromDateInput, toDateInput } from "../lib/format";
import { TASK_PRIORITIES, TASK_STATUSES } from "../constants";
function isStatus(value) {
  return value === "todo" || value === "in_progress" || value === "done";
}
function isPriority(value) {
  return value === "low" || value === "medium" || value === "high";
}
function toDraft(task) {
  return {
    id: task.id,
    title: task.title,
    description: task.description ?? "",
    status: isStatus(task.status) ? task.status : "todo",
    priority: isPriority(task.priority) ? task.priority : "medium",
    dueDate: toDateInput(task.dueDate)
  };
}
function TaskPage() {
  const { orgId = "", workspaceId = "", projectId = "", taskId = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [draft, setDraft] = useState(null);
  const [formError, setFormError] = useState(null);
  const [comment, setComment] = useState("");
  const [commentError, setCommentError] = useState(null);
  const organization = useQuery({
    queryKey: organizationKeys.detail(orgId),
    queryFn: () => getOrganization(orgId),
    enabled: Boolean(orgId)
  });
  const workspace = useQuery({
    queryKey: workspaceKeys.detail(workspaceId),
    queryFn: () => getWorkspace(workspaceId),
    enabled: Boolean(workspaceId)
  });
  const project = useQuery({
    queryKey: projectKeys.detail(projectId),
    queryFn: () => getProject(projectId),
    enabled: Boolean(projectId)
  });
  const taskQuery = useQuery({
    queryKey: taskKeys.detail(taskId),
    queryFn: () => getTask(taskId),
    enabled: Boolean(taskId)
  });
  const comments = useQuery({
    queryKey: commentKeys.list(taskId),
    queryFn: () => listComments(taskId),
    enabled: Boolean(taskId)
  });
  const task = taskQuery.data;
  const form = task ? draft && draft.id === task.id ? draft : toDraft(task) : null;
  const save = useMutation({
    mutationFn: async () => {
      if (!task || !form) throw new Error("Task is still loading");
      const due = fromDateInput(form.dueDate);
      return updateTask(task.id, {
        title: form.title.trim(),
        description: form.description.trim(),
        status: form.status,
        priority: form.priority,
        dueDate: due
      });
    },
    onSuccess: async (updated) => {
      setFormError(null);
      setDraft(toDraft(updated));
      await queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
      await queryClient.invalidateQueries({ queryKey: taskKeys.list(projectId) });
    },
    onError: (error) => setFormError(errorMessage(error))
  });
  const remove = useMutation({
    mutationFn: () => deleteTask(taskId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: taskKeys.list(projectId) });
      navigate(`/organizations/${orgId}/workspaces/${workspaceId}/projects/${projectId}`);
    },
    onError: (error) => setFormError(errorMessage(error))
  });
  const addComment = useMutation({
    mutationFn: (content) => createComment(taskId, content),
    onSuccess: async () => {
      setComment("");
      setCommentError(null);
      await queryClient.invalidateQueries({ queryKey: commentKeys.list(taskId) });
    },
    onError: (error) => setCommentError(errorMessage(error))
  });
  function onSave(event) {
    event.preventDefault();
    if (!form?.title.trim()) {
      setFormError("Title is required.");
      return;
    }
    setFormError(null);
    save.mutate();
  }
  function onComment(event) {
    event.preventDefault();
    const content = comment.trim();
    if (!content) {
      setCommentError("Write a comment first.");
      return;
    }
    setCommentError(null);
    addComment.mutate(content);
  }
  const ordered = [...comments.data ?? []].sort((left, right) => {
    const a = left.createdAt ? Date.parse(left.createdAt) : 0;
    const b = right.createdAt ? Date.parse(right.createdAt) : 0;
    return a - b;
  });
  const projectPath = `/organizations/${orgId}/workspaces/${workspaceId}/projects/${projectId}`;
  return <div>
      <Breadcrumbs
    items={[
      { label: "Organizations", to: "/" },
      { label: organization.data?.name ?? "Organization", to: `/organizations/${orgId}` },
      { label: workspace.data?.name ?? "Workspace", to: `/organizations/${orgId}/workspaces/${workspaceId}` },
      { label: project.data?.name ?? "Project", to: projectPath },
      { label: task?.title ?? "Task" }
    ]}
  />
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <PageHeader eyebrow="Task" title={task?.title ?? "Task"} description="Edit the task, then leave a comment." />
        <Button
    variant="danger"
    disabled={remove.isPending || !taskId}
    onClick={() => {
      if (window.confirm("Delete this task?")) remove.mutate();
    }}
  >
          {remove.isPending ? "Deleting..." : "Delete task"}
        </Button>
      </div>

      {taskQuery.isLoading ? <Spinner label="Loading task" /> : null}
      {taskQuery.isError ? <Alert>{errorMessage(taskQuery.error)}</Alert> : null}

      {form ? <div className="grid gap-6 lg:grid-cols-2">
          <Panel>
            <h2 className="text-sm font-semibold">Details</h2>
            <form className="mt-4 space-y-3" onSubmit={onSave}>
              {formError ? <Alert>{formError}</Alert> : null}
              <Field label="Title">
                <TextInput
    required
    value={form.title}
    onChange={(event) => setDraft({ ...form, title: event.target.value })}
  />
              </Field>
              <Field label="Description">
                <TextArea
    value={form.description}
    onChange={(event) => setDraft({ ...form, description: event.target.value })}
  />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Status">
                  <SelectInput
    value={form.status}
    onChange={(event) => setDraft({ ...form, status: event.target.value })}
  >
                    {TASK_STATUSES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </SelectInput>
                </Field>
                <Field label="Priority">
                  <SelectInput
    value={form.priority}
    onChange={(event) => setDraft({ ...form, priority: event.target.value })}
  >
                    {TASK_PRIORITIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </SelectInput>
                </Field>
              </div>
              <Field label="Due date">
                <TextInput
    type="date"
    value={form.dueDate}
    onChange={(event) => setDraft({ ...form, dueDate: event.target.value })}
  />
              </Field>
              <div className="flex items-center gap-3">
                <Button type="submit" disabled={save.isPending}>
                  {save.isPending ? "Saving..." : "Save changes"}
                </Button>
                {save.isSuccess ? <p className="text-sm text-tide-800">Saved</p> : null}
              </div>
            </form>
          </Panel>

          <Panel>
            <h2 className="text-sm font-semibold">Comments</h2>
            <div className="mt-4 space-y-3">
              {comments.isLoading ? <Spinner label="Loading comments" /> : null}
              {comments.isError ? <Alert>{errorMessage(comments.error)}</Alert> : null}
              {comments.data && ordered.length === 0 ? <EmptyState title="No comments yet" body="Notes on this task show up here." /> : null}
              <ul className="space-y-3">
                {ordered.map((item) => {
    const mine = Boolean(user && item.authorId && item.authorId === user.id);
    const who = mine ? "You" : item.authorName || "Teammate";
    return <li key={item.id} className="rounded-xl bg-tide-50/70 px-3 py-3">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="text-sm font-medium">{who}</p>
                        <time className="text-xs text-ink-muted">{formatWhen(item.createdAt)}</time>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-ink">{item.content}</p>
                    </li>;
  })}
              </ul>
              <form className="space-y-3" onSubmit={onComment}>
                {commentError ? <Alert>{commentError}</Alert> : null}
                <Field label="Add a comment">
                  <TextArea
    required
    value={comment}
    placeholder="What changed?"
    onChange={(event) => setComment(event.target.value)}
  />
                </Field>
                <Button type="submit" disabled={addComment.isPending}>
                  {addComment.isPending ? "Posting..." : "Post comment"}
                </Button>
              </form>
            </div>
          </Panel>
        </div> : null}
    </div>;
}
export {
  TaskPage
};
