import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { errorMessage } from "../api/client";
import { getOrganization, organizationKeys } from "../api/organizations";
import { getProject, projectKeys } from "../api/projects";
import { createTask, listTasks, taskKeys, updateTask } from "../api/tasks";
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
import { formatDay, fromDateInput, priorityLabel, statusLabel } from "../lib/format";
import { TASK_PRIORITIES, TASK_STATUSES } from "../constants";
const columns = [
  { status: "todo", label: "To do" },
  { status: "in_progress", label: "In progress" },
  { status: "done", label: "Done" }
];
function priorityClass(priority) {
  if (priority === "high") return "bg-rose-50 text-rose-700";
  if (priority === "low") return "bg-slate-100 text-slate-600";
  return "bg-amber-50 text-amber-800";
}
function ProjectPage() {
  const { orgId = "", workspaceId = "", projectId = "" } = useParams();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("todo");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const [formError, setFormError] = useState(null);
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
  const tasks = useQuery({
    queryKey: taskKeys.list(projectId),
    queryFn: () => listTasks(projectId),
    enabled: Boolean(projectId)
  });
  const create = useMutation({
    mutationFn: () => {
      const due = fromDateInput(dueDate);
      return createTask(projectId, {
        title: title.trim(),
        description: description.trim() || void 0,
        status,
        priority,
        ...due ? { dueDate: due } : {}
      });
    },
    onSuccess: async () => {
      setTitle("");
      setDescription("");
      setStatus("todo");
      setPriority("medium");
      setDueDate("");
      setFormError(null);
      await queryClient.invalidateQueries({ queryKey: taskKeys.list(projectId) });
    },
    onError: (error) => setFormError(errorMessage(error))
  });
  const updateStatus = useMutation({
    mutationFn: (input) => updateTask(input.id, { status: input.status }),
    onSuccess: async (_task, input) => {
      await queryClient.invalidateQueries({ queryKey: taskKeys.list(projectId) });
      await queryClient.invalidateQueries({ queryKey: taskKeys.detail(input.id) });
    }
  });
  function onSubmit(event) {
    event.preventDefault();
    if (!title.trim()) {
      setFormError("Task title is required.");
      return;
    }
    setFormError(null);
    create.mutate();
  }
  const items = tasks.data ?? [];
  const known = new Set(columns.map((column) => column.status));
  const other = items.filter((task) => !known.has(task.status));
  return <div>
      <Breadcrumbs
    items={[
      { label: "Organizations", to: "/" },
      { label: organization.data?.name ?? "Organization", to: `/organizations/${orgId}` },
      {
        label: workspace.data?.name ?? "Workspace",
        to: `/organizations/${orgId}/workspaces/${workspaceId}`
      },
      { label: project.data?.name ?? "Project" }
    ]}
  />
      <PageHeader
    eyebrow="Project"
    title={project.data?.name ?? "Project"}
    description={project.data?.description || "Tasks grouped by status. Open a task to edit it or add comments."}
  />
      {project.isError ? <Alert>{errorMessage(project.error)}</Alert> : null}
      {updateStatus.isError ? <div className="mb-4"><Alert>{errorMessage(updateStatus.error)}</Alert></div> : null}

      <Panel className="mb-6">
        <h2 className="text-sm font-semibold">New task</h2>
        <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={onSubmit}>
          {formError ? <div className="md:col-span-2"><Alert>{formError}</Alert></div> : null}
          <Field label="Title">
            <TextInput required value={title} onChange={(event) => setTitle(event.target.value)} />
          </Field>
          <Field label="Due date">
            <TextInput type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
          </Field>
          <Field label="Status">
            <SelectInput value={status} onChange={(event) => setStatus(event.target.value)}>
              {TASK_STATUSES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </SelectInput>
          </Field>
          <Field label="Priority">
            <SelectInput value={priority} onChange={(event) => setPriority(event.target.value)}>
              {TASK_PRIORITIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </SelectInput>
          </Field>
          <div className="md:col-span-2">
            <Field label="Description">
              <TextArea value={description} onChange={(event) => setDescription(event.target.value)} />
            </Field>
          </div>
          <div>
            <Button type="submit" disabled={create.isPending || !projectId}>
              {create.isPending ? "Creating..." : "Create task"}
            </Button>
          </div>
        </form>
      </Panel>

      {tasks.isLoading ? <Spinner label="Loading tasks" /> : null}
      {tasks.isError ? <Alert>{errorMessage(tasks.error)}</Alert> : null}
      {tasks.data && tasks.data.length === 0 ? <EmptyState title="No tasks yet" body="Add a task above. It will show up in the matching column." /> : null}

      {tasks.data && tasks.data.length > 0 ? <div className="grid gap-4 lg:grid-cols-3">
          {columns.map((column) => <TaskColumn
    key={column.status}
    label={column.label}
    tasks={items.filter((task) => task.status === column.status)}
    orgId={orgId}
    workspaceId={workspaceId}
    projectId={projectId}
    pendingId={updateStatus.isPending ? updateStatus.variables?.id : void 0}
    onStatus={(id, next) => updateStatus.mutate({ id, status: next })}
  />)}
        </div> : null}
      {other.length > 0 ? <div className="mt-4">
          <TaskColumn
    label="Other"
    tasks={other}
    orgId={orgId}
    workspaceId={workspaceId}
    projectId={projectId}
    pendingId={updateStatus.isPending ? updateStatus.variables?.id : void 0}
    onStatus={(id, next) => updateStatus.mutate({ id, status: next })}
  />
        </div> : null}
    </div>;
}
function TaskColumn({
  label,
  tasks,
  orgId,
  workspaceId,
  projectId,
  pendingId,
  onStatus
}) {
  return <section className="rounded-2xl bg-white/70 p-3 ring-1 ring-slate-200/80">
      <header className="mb-3 flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold">{label}</h2>
        <span className="text-xs text-ink-muted">{tasks.length}</span>
      </header>
      <div className="space-y-2">
        {tasks.length === 0 ? <p className="px-1 py-4 text-sm text-ink-muted">Nothing here.</p> : null}
        {tasks.map((task) => {
    const options = TASK_STATUSES.some((item) => item.value === task.status) ? TASK_STATUSES : [...TASK_STATUSES, { value: task.status, label: statusLabel(task.status) }];
    return <article key={task.id} className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
              <Link
      to={`/organizations/${orgId}/workspaces/${workspaceId}/projects/${projectId}/tasks/${task.id}`}
      className="font-medium text-ink hover:text-tide-800"
    >
                {task.title}
              </Link>
              {task.description ? <p className="mt-1 line-clamp-2 text-sm text-ink-muted">{task.description}</p> : null}
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${priorityClass(task.priority)}`}>
                  {priorityLabel(task.priority)}
                  {task.dueDate ? ` \xB7 ${formatDay(task.dueDate)}` : ""}
                </span>
              </div>
              <label className="mt-2 block text-xs text-ink-muted">
                Status
                <SelectInput
      className="mt-1 py-1.5"
      value={task.status}
      disabled={pendingId === task.id}
      onChange={(event) => onStatus(task.id, event.target.value)}
    >
                  {options.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </SelectInput>
              </label>
            </article>;
  })}
      </div>
    </section>;
}
export {
  ProjectPage
};
