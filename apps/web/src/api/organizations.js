import { ApiError, api, mapList, normalizeOrganization } from "./client";
import { unwrapEntity } from "./parse";
const organizationKeys = {
  all: ["organizations"],
  detail: (id) => ["organizations", id]
};
function listOrganizations() {
  return api("/organizations?page=1&limit=100").then(
    (body) => mapList(body, normalizeOrganization)
  );
}
async function getOrganization(id) {
  const body = await api(`/organizations/${encodeURIComponent(id)}`);
  const organization = normalizeOrganization(unwrapEntity(body, "organization"));
  if (!organization) throw new ApiError("Organization not found", 404, "NOT_FOUND");
  return organization;
}
async function createOrganization(name) {
  const body = await api("/organizations", {
    method: "POST",
    body: { name }
  });
  const organization = normalizeOrganization(unwrapEntity(body, "organization"));
  if (!organization) throw new ApiError("Organization response was empty", 500, "BAD_RESPONSE");
  return organization;
}
export {
  createOrganization,
  getOrganization,
  listOrganizations,
  organizationKeys
};
