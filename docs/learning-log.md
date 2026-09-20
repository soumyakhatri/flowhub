# FlowHub Learning Log

Personal system-design reference. Updated after each major phase.

---

## Phase 0 — Architecture Fundamentals

### Concept learned
Scalability (vertical vs horizontal), availability, latency vs throughput, CAP, consistency models, load balancing, caching, queues, pub/sub — as practical trade-offs, not slogans.

### Problem encountered
Temptation to start with microservices, Kafka, and Kubernetes before any user-facing product exists.

### Architecture before
Empty repository.

### Architecture after
Documented target end-state; committed to **modular monolith** (React → Express → MongoDB) as Phase 1.

### Why the change was necessary
Without shared vocabulary and a progressive roadmap, technology choices become cargo-culting.

### Trade-offs
- Slower to "look like" a big distributed system early
- Faster feedback on domain model and API design
- Avoids distributed complexity before it teaches anything

### Failure scenarios
N/A (documentation phase).

### Important interview questions
- How would you design a Jira-like system from scratch?
- When would you choose a modular monolith over microservices?
- Explain CAP with a real product scenario.
- Latency vs throughput — how do they differ?

### Lessons learned
Every component in the eventual architecture must earn its place by solving a concrete FlowHub problem.

---

## Phase 1 — Modular Monolith

### Concept learned
A modular monolith is one deployable process with explicit domain modules (auth, users, organizations, workspaces, projects, tasks, comments). Cross-cutting code lives in common/ and infrastructure/. Access tokens stay stateless (15 minutes, Bearer). Refresh tokens last 7 days, travel in an httpOnly cookie, and are stored as SHA-256 hashes in refresh_tokens so logout and reuse can revoke them.

### Problem encountered
Phase 0 had a domain model and API sketch, but nothing ran. Starting with microservices, Redis, or Kafka would have added network and consistency problems before membership and authorization rules were proven.

### Architecture before
Documentation only: domain hierarchy, MongoDB collections and indexes, and the /api/v1 endpoint list.

### Architecture after
apps/api is an Express + TypeScript modular monolith backed by MongoDB (Mongoose). One process, one database. Controllers stay thin; services own authorization and writes. Errors are { error: { code, message, requestId } }.

### Why the change was necessary
A single codebase lets module boundaries and role checks be exercised with normal function calls and one database. That is the right cost until a concrete scaling or isolation problem shows up.

### Trade-offs
- One process is simple to run and debug, but every module shares the same failure and scaling domain.
- workspaceId is denormalized onto tasks so later activity queries do not join through projects. Writers must keep that field consistent.
- Offset pagination (page, limit, max 100) is enough for Phase 1 and will not age as well as cursors once task lists grow.
- Refresh-token rotation adds a write on every refresh. That cost buys revocation, which stateless refresh tokens cannot do.

### Failure scenarios
- MongoDB down: GET /health still returns ok; GET /ready returns 503. Startup fails if the initial connection fails.
- Invalid environment: the process refuses to boot (Zod).
- A rotated refresh token is presented again: remaining refresh tokens for that user are revoked.
- Duplicate email or membership writes hit unique indexes and return 409.

### Important interview questions
- Why a modular monolith instead of microservices for the first version?
- How do access and refresh tokens differ, and why hash refresh tokens at rest?
- Which indexes support "tasks in a project by status" and "organizations for a user"?
- Where should authorization live: middleware, controller, or service?
- What breaks if an unbounded member list is embedded on the organization document?

### Lessons learned
Folder boundaries do not enforce themselves. Cross-module imports should be models and access helpers, not each other's services. Consistent errors and startup config validation make failures explicit before distributed tracing exists.
