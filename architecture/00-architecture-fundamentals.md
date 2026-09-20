# 00 — Architecture Fundamentals (Phase 0)

This document is the foundation for every later FlowHub decision. Before writing production code, we align on the vocabulary and trade-offs of distributed systems.

---

## 1. Scalability

**Definition:** Ability to handle growing load (users, requests, data) by adding resources.

| Type | Meaning | FlowHub example |
|------|---------|-----------------|
| Vertical | Bigger machine (more CPU/RAM) | Single API + MongoDB on larger hosts |
| Horizontal | More machines | Multiple API instances behind a load balancer |

**Phase 1 choice:** Design the API as **stateless** so horizontal scaling is possible later without rewriting business logic. We do **not** run multiple instances yet.

**Interview framing:** "How would you scale FlowHub?" → Start with bottlenecks (DB? CPU? WebSockets?), then choose vertical vs horizontal per tier.

---

## 2. Availability

**Definition:** Probability the system is reachable and correct enough to serve requests.

Common target: **99.9%** ≈ 8.7 hours downtime/year.

Availability is not free: replicas, health checks, failover, and multi-AZ all cost money and complexity.

**Phase 1:** Single API process + MongoDB. Availability ≈ process + DB uptime. Acceptable for learning; insufficient for production at scale.

---

## 3. Latency vs Throughput

| Metric | Meaning | FlowHub example |
|--------|---------|-----------------|
| Latency | Time for one request | `POST /tasks` p95 = 80ms |
| Throughput | Requests per second | 2,000 RPS on task list |

Optimizing for latency ≠ optimizing for throughput. Caching can improve both; batching often improves throughput at the cost of latency.

We will **measure** before claiming improvements (Phase 18 — load testing).

---

## 4. Reliability

**Definition:** Correctness under stress and failure — retries, timeouts, graceful degradation.

Reliability techniques we will introduce when needed:

- Timeouts (avoid hanging forever)
- Retries with backoff (and idempotency)
- Circuit breakers / bulkheads (later)
- Health checks and graceful shutdown (Phase 4)

---

## 5. CAP Theorem (Practical View)

Under a **network partition**, a distributed system must choose:

- **C**onsistency — all nodes see the same data
- **A**vailability — every request gets a (non-error) response
- **P**artition tolerance — system continues despite network splits

In practice, partitions happen; systems lean **CP** or **AP** for a given operation.

### FlowHub scenarios

| Feature | Desired | Why |
|---------|---------|-----|
| Assign task (source of truth) | Stronger consistency | User must see correct assignee after write |
| Search index after task update | Eventual consistency | Slight lag acceptable; search is a derived view |
| Presence ("user online") | Highly available, ephemeral | Stale presence is OK; durability less critical |

CAP is not a slogan — it is a **per-operation** trade-off.

---

## 6. Consistency Models

| Model | Meaning | FlowHub use |
|-------|---------|-------------|
| Strong | Reads see latest committed write | Task status in MongoDB after PATCH |
| Read-after-write | Actor sees their own writes | Creator sees new task immediately |
| Eventual | Replicas converge later | OpenSearch / analytics (future) |
| Causal | Related events preserve cause→effect | Comment after task create (future event ordering) |

---

## 7. Load Balancing

Distributes traffic across instances.

```
Client → Load Balancer → API #1
                       → API #2
                       → API #3
```

Requires: **stateless APIs**, shared session/token store (or JWT), shared DB, health checks.

**Phase 1:** No LB yet. We still avoid storing session state in process memory so Phase 4 is straightforward.

---

## 8. Caching

Store frequently read data closer to the CPU to reduce DB load and latency.

Problems caching introduces:

- **Invalidation** — when is cache stale?
- **Stampede** — many clients miss at once
- **Penetration** — caching "not found" incorrectly (or not at all)

**Phase 1:** No Redis. Identify hot paths first (e.g., project details), then introduce cache-aside in Phase 3.

---

## 9. Queues

Decouple producers from slow consumers.

```
API → Queue → Worker (email, notifications, reports)
```

Benefits: faster HTTP responses, retries, backpressure.

**Phase 1:** Notifications/activity written synchronously or deferred lightly. Heavy async work waits for BullMQ / SQS.

---

## 10. Pub/Sub

Publishers emit messages; subscribers receive them independently.

| Use | Tool (later) |
|-----|--------------|
| Transient fan-out (WebSocket cross-node) | Redis Pub/Sub |
| Durable business events | Kafka |
| Work queues | BullMQ / SQS |

They are **not interchangeable**. Pub/Sub without retention cannot replay; Kafka can.

---

## 11. Horizontal vs Vertical — Decision Guide

Ask for each bottleneck:

1. What is the scarce resource?
2. Does adding one bigger box help enough?
3. Does the component share mutable in-memory state?
4. What is the operational cost of N replicas?

FlowHub's learning path intentionally hits the **"multiple Node processes + WebSockets"** problem so Redis Pub/Sub becomes necessary rather than decorative.

---

## 12. Scale Thought Experiments

| Users | Likely bottleneck (early FlowHub) |
|-------|-----------------------------------|
| 10 | Developer velocity, not infra |
| 100 | Still fine on one API + MongoDB |
| 1,000 | Indexes, N+1 queries, auth |
| 10,000 | DB connections, hot documents, rate limits |
| 100,000 | Caching, read replicas, async notifications |
| 1,000,000 | Partitioning, event pipelines, search, CDN, multi-region |

We revisit this table as we add components.

---

## 13. What Phase 0 Delivers

- Shared vocabulary for scalability, availability, consistency, caching, queues, pub/sub
- Explicit decision: start as modular monolith on React + Express + MongoDB
- Roadmap that delays Kafka/K8s until prerequisites exist
- ADR-001 and ADR-002 capturing those choices

## Learning Notes

### Problem
Teams often jump to microservices, Kafka, and Kubernetes before understanding the problems those tools solve.

### Solution
Phase 0 documents fundamentals and commits to a progressive architecture.

### Interview Question
"Design a collaborative task system like Jira. Where do you start, and what do you defer?"

**Answer shape:** Domain model → modular monolith → identify bottlenecks → introduce caching, async, real-time, then durable events — justify each step.
