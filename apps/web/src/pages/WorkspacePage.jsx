import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { errorMessage } from "../api/client";
import { getOrganization, organizationKeys } from "../api/organizations";
import { createProject, listProjects, projectKeys } from "../api/projects";
import { getWorkspace, workspaceKeys } from "../api/workspaces";
import { Alert, Breadcrumbs, Button, EmptyState, Field, PageHeader, Panel, Spinner, TextArea, TextInput } from "../components/ui";
function WorkspacePage() {
  const { orgId = "", workspaceId = "" } = useParams();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
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
  const projects = useQuery({
    queryKey: projectKeys.list(workspaceId),
    queryFn: () => listProjects(workspaceId),
    enabled: Boolean(workspaceId)
  });
  const create = useMutation({
    mutationFn: () => createProject(workspaceId, {
      name: name.trim(),
      description: description.trim() || void 0
    }),
    onSuccess: async () => {
      setName("");
      setDescription("");
      setFormError(null);
      await queryClient.invalidateQueries({ queryKey: projectKeys.list(workspaceId) });
    },
    onError: (error) => setFormError(errorMessage(error))
  });
  function onSubmit(event) {
    event.preventDefault();
    if (!name.trim()) {
      setFormError("Project name is required.");
      return;
    }
    setFormError(null);
    create.mutate();
  }
  const orgName = organization.data?.name ?? "Organization";
  const workspaceName = workspace.data?.name ?? "Workspace";
  return <div>
      <Breadcrumbs
    items={[
      { label: "Organizations", to: "/" },
      { label: orgName, to: `/organizations/${orgId}` },
      { label: workspaceName }
    ]}
  />
      <PageHeader
    eyebrow="Workspace"
    title={workspaceName}
    description={workspace.data?.description || "Projects in this workspace."}
  />
      {workspace.isError ? <Alert>{errorMessage(workspace.error)}</Alert> : null}
      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Panel>
          <h2 className="text-sm font-semibold">New project</h2>
          <form className="mt-4 space-y-3" onSubmit={onSubmit}>
            {formError ? <Alert>{formError}</Alert> : null}
            <Field label="Name">
              <TextInput required value={name} onChange={(event) => setName(event.target.value)} />
            </Field>
            <Field label="Description">
              <TextArea value={description} onChange={(event) => setDescription(event.target.value)} />
            </Field>
            <Button type="submit" disabled={create.isPending || !workspaceId}>
              {create.isPending ? "Creating..." : "Create project"}
            </Button>
          </form>
        </Panel>
        <div className="space-y-3">
          {projects.isLoading ? <Spinner label="Loading projects" /> : null}
          {projects.isError ? <Alert>{errorMessage(projects.error)}</Alert> : null}
          {projects.data && projects.data.length === 0 ? <EmptyState title="No projects yet" body="Create a project to start a task list." /> : null}
          {projects.data?.map((project) => <Link
    key={project.id}
    to={`/organizations/${orgId}/workspaces/${workspaceId}/projects/${project.id}`}
    className="block rounded-2xl border border-white/80 bg-white/90 p-4 shadow-card transition hover:border-tide-200"
  >
              <h2 className="text-lg font-semibold">{project.name}</h2>
              <p className="mt-1 line-clamp-2 text-sm text-ink-muted">
                {project.description || "Open task board"}
              </p>
            </Link>)}
        </div>
      </div>
    </div>;
}
export {
  WorkspacePage
};
