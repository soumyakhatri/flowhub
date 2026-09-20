# 03 — Database Design (MongoDB)

## Why MongoDB (Phase 1)

See [ADR-002](./adr/ADR-002-mongodb.md).

Short version: flexible documents map well to collaborative entities; we still design indexes and relationships deliberately — MongoDB is not "schemaless chaos."

## Embedding vs Referencing

| Pattern | When | FlowHub |
|---------|------|---------|
| Embed | Small, bounded, always read with parent | Avoid embedding unbounded member lists |
| Reference | Many-to-many, independently queried, unbounded growth | Members, tasks, comments |

**Rule of thumb:** If the array can grow without a hard upper bound, **reference**.

## Collections (Phase 1)

### `users`
- Unique index: `email`
- Why: login and registration uniqueness

### `organizations`
- Index: `createdBy` (optional admin queries)

### `organization_members`
- Unique compound: `{ organizationId: 1, userId: 1 }`
- Index: `{ userId: 1 }` — "list orgs for user"
- Why: membership lookups dominate authz paths

### `workspaces`
- Index: `{ organizationId: 1, createdAt: -1 }`

### `workspace_members`
- Unique compound: `{ workspaceId: 1, userId: 1 }`
- Index: `{ userId: 1 }`

### `projects`
- Index: `{ workspaceId: 1, createdAt: -1 }`
- Why: primary list endpoint is workspace-scoped

### `tasks`
- Index: `{ projectId: 1, status: 1, createdAt: -1 }` — board/list views
- Index: `{ assigneeId: 1, status: 1 }` — "my tasks"
- Index: `{ workspaceId: 1, updatedAt: -1 }` — workspace activity (later)

### `comments`
- Index: `{ taskId: 1, createdAt: 1 }` — chronological thread

### `activities` / `notifications` (stub collections ready)
- Indexes documented when write paths stabilize

## Query Patterns We Optimize For

1. List projects in a workspace (paginated)
2. List tasks in a project filtered by status
3. List tasks assigned to current user
4. Authz: is user member of workspace/org?
5. Comment thread for a task

## What We Explicitly Avoid (For Now)

- Multi-document transactions for every write (use when outbox arrives)
- Premature sharding
- Storing files in GridFS (use S3 later)
- Dual-writing to search indexes inside HTTP handlers

## Data Growth Notes

Tasks and comments grow fastest. Pagination (cursor where appropriate) is mandatory from Phase 1/2. Archival strategy is deferred until volume justifies it.
