# ADR-002: MongoDB as Primary Datastore

## Status
Accepted

## Context
Phase 1 needs a primary database for users, orgs, workspaces, projects, tasks, and comments.

## Problem
Which database fits collaborative document-oriented entities while remaining production-credible for learning indexing, growth, and later outbox/transactions?

## Options considered

1. **PostgreSQL** — strong relational model, excellent constraints
2. **MongoDB** — document model, flexible schemas, Atlas ops path
3. **SQLite** — too limited for the intended multi-user learning path

## Decision
Use **MongoDB** with explicit schemas (Zod + Mongoose or native driver + validation), deliberate indexes, and documented embed-vs-reference choices.

## Consequences
- Natural document shape for tasks/projects
- Must be careful with unbounded arrays (prefer references)
- Multi-document transactions available when outbox pattern arrives
- Search will later use OpenSearch as a derived read model — not dual-write in HTTP

## Trade-offs
| Gain | Cost |
|------|------|
| Flexible documents | Weaker relational joins; denormalize carefully |
| Matches many real-time collab stacks | Easy to create bad schemas without discipline |
| Learning path toward change streams / outbox | Must learn index design explicitly |

## Related
- [03-database-design.md](../03-database-design.md)