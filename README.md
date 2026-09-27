# FlowHub

FlowHub is a collaborative project and workflow management platform — and a hands-on **system-design laboratory**.

We build production-quality software while progressively introducing the architecture of scalable distributed systems. We start as a modular monolith and only add Redis, WebSockets, queues, Kafka, search, CQRS, and microservices when each solves a concrete problem.

## Why this project exists

1. Ship a real product shape: orgs → workspaces → projects → tasks → comments
2. Learn system design by implementing it, not only reading about it

## Current architecture (Phase 1)

```
React (apps/web)
      ↓  REST /api/v1
Express modular monolith (apps/api)
      ↓
MongoDB
```

See [architecture/01-system-overview.md](./architecture/01-system-overview.md) and the [roadmap](./architecture/ROADMAP.md).

## Technology stack

| Layer | Choice |
|-------|--------|
| Frontend | React, JavaScript (ESM), Vite, React Router, TanStack Query, Tailwind |
| Backend | Node.js, JavaScript (ESM), Express |
| Database | MongoDB (Mongoose) |
| Auth | Access JWT + rotating refresh tokens (hashed at rest) |

## Repository layout

```
apps/api          Modular monolith API
apps/web          React SPA
architecture/     System design docs, ADRs, roadmap
docs/             Learning log and concept explanations
```

## Local setup

### Prerequisites

- Node.js 20+
- Docker (for MongoDB)

### 1. Environment

```bash
cp .env.example .env
```

Set `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` to long random strings (≥32 characters).

Optional web env:

```bash
cp apps/web/.env.example apps/web/.env
```

Default API URL for the web app: `http://localhost:3000/api/v1`.

### 2. Install

```bash
npm install
```

### 3. Start MongoDB

```bash
docker compose up -d
```

### 4. Run API

```bash
npm run dev:api
```

- API: http://localhost:3000
- Health: http://localhost:3000/health
- Ready: http://localhost:3000/ready

### 5. Run web

```bash
npm run dev:web
```

- UI: http://localhost:5173

## Tests

```bash
npm test
```

## Architecture documentation

| Doc | Topic |
|-----|-------|
| [00-architecture-fundamentals.md](./architecture/00-architecture-fundamentals.md) | Phase 0 concepts |
| [01-system-overview.md](./architecture/01-system-overview.md) | High-level system |
| [02-domain-model.md](./architecture/02-domain-model.md) | Entities and relationships |
| [03-database-design.md](./architecture/03-database-design.md) | MongoDB design |
| [04-api-design.md](./architecture/04-api-design.md) | REST conventions |
| [ROADMAP.md](./architecture/ROADMAP.md) | Phase plan |
| [progress.html](./architecture/progress.html) | Done vs pending board (open in a browser) |
| [adr/](./architecture/adr/) | Architecture Decision Records |
| [what-we-learned.md](./docs/what-we-learned.md) | Explanations of each concept, for rereading |
| [learning-log.md](./docs/learning-log.md) | Phase checklist, trade-offs, interview Qs |

## System-design concepts demonstrated so far

- Modular monolith vs microservices
- Domain-oriented module boundaries
- Embed vs reference in MongoDB
- Index design driven by query patterns
- JWT access + refresh rotation and revocation
- Stateless API design (ready for horizontal scaling later)
- Consistent API errors and request IDs
- Startup config validation (fail fast)

## What we are deliberately NOT building yet

Redis, WebSockets, BullMQ, SQS, Kafka, OpenSearch, CQRS, Saga, Kubernetes, microservices.

Each arrives when a Phase gate problem appears. See the roadmap.

## Scaling strategy (preview)

1. Stateless API → multiple instances + load balancer
2. Redis for cache and distributed rate limits
3. WebSockets + Redis Pub/Sub for multi-node real-time
4. Async workers for email/notifications
5. Durable events (Kafka) + outbox for reliable publishing
6. Search as an eventually consistent read model

## Failure-handling strategy (preview)

Every major dependency must answer: what happens when it is down? Can we retry safely? Is the operation idempotent? Does the user see a clear error? Can the system recover automatically?

Phase 1 answers this for MongoDB (`/ready`) and auth token reuse (refresh family revocation).

## License

Private learning project.