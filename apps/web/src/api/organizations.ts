import type { Organization } from "../types";
import { ApiError, api, mapList, normalizeOrganization } from "./client";
import { unwrapEntity } from "./parse";

export const organizationKeys = {
  all: ["organizations"] as const,
  detail: (id: string) => ["organizations", id] as const,
};

export function listOrganizations() {
  return api<unknown>("/organizations?page=1&limit=100").then((body) =>
    mapList(body, normalizeOrganization),
  );
}

export async function getOrganization(id: string): Promise<Organization> {
  const body = await api<unknown>(`/organizations/${encodeURIComponent(id)}`);
  const organization = normalizeOrganization(unwrapEntity(body, "organization"));
  if (!organization) throw new ApiError("Organization not found", 404, "NOT_FOUND");
  return organization;
}

export async function createOrganization(name: string): Promise<Organization> {
  const body = await api<unknown>("/organizations", {
    method: "POST",
    body: { name },
  });
  const organization = normalizeOrganization(unwrapEntity(body, "organization"));
  if (!organization) throw new ApiError("Organization response was empty", 500, "BAD_RESPONSE");
  return organization;
}