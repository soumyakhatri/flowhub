import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { errorMessage } from "../api/client";
import { createOrganization, listOrganizations, organizationKeys } from "../api/organizations";
import { Alert, Button, EmptyState, Field, PageHeader, Panel, Spinner, TextInput } from "../components/ui";
function OrganizationsPage() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [formError, setFormError] = useState(null);
  const orgs = useQuery({ queryKey: organizationKeys.all, queryFn: listOrganizations });
  const create = useMutation({
    mutationFn: (orgName) => createOrganization(orgName),
    onSuccess: async () => {
      setName("");
      setFormError(null);
      await queryClient.invalidateQueries({ queryKey: organizationKeys.all });
    },
    onError: (error) => setFormError(errorMessage(error))
  });
  function onSubmit(event) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setFormError("Organization name is required.");
      return;
    }
    setFormError(null);
    create.mutate(trimmed);
  }
  return <div>
      <PageHeader
    eyebrow="Home"
    title="Organizations"
    description="Each organization holds workspaces, projects, and tasks."
  />
      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Panel>
          <h2 className="text-sm font-semibold">New organization</h2>
          <form className="mt-4 space-y-3" onSubmit={onSubmit}>
            {formError ? <Alert>{formError}</Alert> : null}
            <Field label="Name">
              <TextInput
    required
    value={name}
    placeholder="Acme"
    onChange={(event) => setName(event.target.value)}
  />
            </Field>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? "Creating..." : "Create organization"}
            </Button>
          </form>
        </Panel>
        <div className="space-y-3">
          {orgs.isLoading ? <Spinner label="Loading organizations" /> : null}
          {orgs.isError ? <Alert>{errorMessage(orgs.error)}</Alert> : null}
          {orgs.data && orgs.data.length === 0 ? <EmptyState title="No organizations yet" body="Create one to add a workspace and start a project." /> : null}
          {orgs.data?.map((org) => <Link
    key={org.id}
    to={`/organizations/${org.id}`}
    className="block rounded-2xl border border-white/80 bg-white/90 p-4 shadow-card transition hover:border-tide-200"
  >
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg font-semibold">{org.name}</h2>
                {org.role ? <span className="rounded-full bg-tide-50 px-2 py-0.5 text-xs font-medium text-tide-800">
                    {org.role}
                  </span> : null}
              </div>
              <p className="mt-1 text-sm text-ink-muted">Open workspaces</p>
            </Link>)}
        </div>
      </div>
    </div>;
}
export {
  OrganizationsPage
};
