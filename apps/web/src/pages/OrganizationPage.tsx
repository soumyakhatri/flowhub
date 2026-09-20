import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { errorMessage } from "../api/client";
import { getOrganization, organizationKeys } from "../api/organizations";
import { createWorkspace, listWorkspaces, workspaceKeys } from "../api/workspaces";
import { Alert, Breadcrumbs, Button, EmptyState, Field, PageHeader, Panel, Spinner, TextArea, TextInput } from "../components/ui";

export function OrganizationPage() {
  const { orgId = "" } = useParams();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const organization = useQuery({
    queryKey: organizationKeys.detail(orgId),
    queryFn: () => getOrganization(orgId),
    enabled: Boolean(orgId),
  });
  const workspaces = useQuery({
    queryKey: workspaceKeys.list(orgId),
    queryFn: () => listWorkspaces(orgId),
    enabled: Boolean(orgId),
  });
  const create = useMutation({
    mutationFn: () =>
      createWorkspace(orgId, {
        name: name.trim(),
        description: description.trim() || undefined,
      }),
    onSuccess: async () => {
      setName("");
      setDescription("");
      setFormError(null);
      await queryClient.invalidateQueries({ queryKey: workspaceKeys.list(orgId) });
    },
    onError: (error) => setFormError(errorMessage(error)),
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setFormError("Workspace name is required.");
      return;
    }
    setFormError(null);
    create.mutate();
  }

  const title = organization.data?.name ?? "Organization";

  return (
    <div>
      <Breadcrumbs items={[{ label: "Organizations", to: "/" }, { label: title }]} />
      <PageHeader
        eyebrow="Organization"
        title={title}
        description="Workspaces keep projects for a team or function inside this organization."
      />
      {organization.isError ? <Alert>{errorMessage(organization.error)}</Alert> : null}
      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Panel>
          <h2 className="text-sm font-semibold">New workspace</h2>
          <form className="mt-4 space-y-3" onSubmit={onSubmit}>
            {formError ? <Alert>{formError}</Alert> : null}
            <Field label="Name">
              <TextInput required value={name} onChange={(event) => setName(event.target.value)} />
            </Field>
            <Field label="Description">
              <TextArea value={description} onChange={(event) => setDescription(event.target.value)} />
            </Field>
            <Button type="submit" disabled={create.isPending || !orgId}>
              {create.isPending ? "Creating..." : "Create workspace"}
            </Button>
          </form>
        </Panel>
        <div className="space-y-3">
          {workspaces.isLoading ? <Spinner label="Loading workspaces" /> : null}
          {workspaces.isError ? <Alert>{errorMessage(workspaces.error)}</Alert> : null}
          {workspaces.data && workspaces.data.length === 0 ? (
            <EmptyState title="No workspaces yet" body="Create a workspace, then add a project inside it." />
          ) : null}
          {workspaces.data?.map((workspace) => (
            <Link
              key={workspace.id}
              to={`/organizations/${orgId}/workspaces/${workspace.id}`}
              className="block rounded-2xl border border-white/80 bg-white/90 p-4 shadow-card transition hover:border-tide-200"
            >
              <h2 className="text-lg font-semibold">{workspace.name}</h2>
              {workspace.description ? (
                <p className="mt-1 line-clamp-2 text-sm text-ink-muted">{workspace.description}</p>
              ) : (
                <p className="mt-1 text-sm text-ink-muted">Open projects</p>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}