# FlowHub Architecture Roadmap

Progressive evolution. Do not skip ahead without completing prerequisites.

Visual board: [progress.html](./progress.html). When a phase status changes, update this table and that file together, then record the lesson in [docs/learning-log.md](../docs/learning-log.md). Explanations of each concept go in [docs/what-we-learned.md](../docs/what-we-learned.md) as they are taught.

| Phase | Name | Status |
|-------|------|--------|
| 0 | Architecture Fundamentals | Complete |
| 1 | Modular Monolith | Complete |
| 2 | Production Hardening | Not started |
| 3 | Redis (cache, rate limit) | Not started |
| 4 | Horizontal Scaling | Not started |
| 5 | WebSockets | Not started |
| 6 | Redis Pub/Sub | Not started |
| 7 | Background Jobs (BullMQ) | Not started |
| 8 | AWS SQS | Not started |
| 9 | Event-Driven Architecture | Not started |
| 10 | Kafka | Not started |
| 11 | Transactional Outbox | Not started |
| 12 | Search (OpenSearch) | Not started |
| 13 | CQRS | Not started |
| 14 | Notifications Pipeline | Not started |
| 15 | Activity Feed | Not started |
| 16 | Distributed Workflows (Saga) | Not started |
| 17 | Observability | Not started |
| 18 | Load Testing | Not started |
| 19 | Microservices (selective) | Not started |
| 20 | AWS Deployment | Not started |
| 21 | Kubernetes | Not started |

## Phase Gate Rule

Each phase must answer:

1. What problem appeared?
2. Why is this the right tool?
3. What are the trade-offs?
4. How do we fail and recover?
5. How do we observe it?

Only then implement.