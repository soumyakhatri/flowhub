# ADR-001: Modular Monolith

## Status
Accepted

## Context
FlowHub needs a production-quality collaborative PM platform and a system-design learning path. Starting with microservices would add network boundaries, deployment complexity, and distributed data problems before the domain is stable.

## Problem
How should we structure the first deployable architecture?

## Options considered

1. **Microservices from day one** — independent services per domain
2. **Classic layered monolith** — global controllers/services/models folders
3. **Modular monolith** — single deployable, domain modules with clear boundaries

## Decision
Adopt a **modular monolith** (Option 3).

Domain modules: `auth`, `users`, `organizations`, `workspaces`, `projects`, `tasks`, `comments`, plus later `notifications`, `activities`, `files`.

Shared cross-cutting code lives in `common/` and `infrastructure/`.

## Consequences
- One process, one deployment, one database (initially)
- Module boundaries prepare future extraction without paying distributed cost yet
- Risk: modules can still couple if we are careless — enforce imports by convention

## Trade-offs
| Gain | Cost |
|------|------|
| Simple ops and debugging | Single scaling unit |
| Transactional consistency inside one DB | Cannot scale one domain independently yet |
| Fast feature delivery | Discipline required to keep modules clean |

## Related
- Phase 1 implementation
- Future Phase 19 microservice extraction criteria