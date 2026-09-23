# ADR-003: JavaScript (ESM) instead of TypeScript

## Status
Accepted

## Context
FlowHub is primarily a system-design learning project. TypeScript was the original default for production quality, but it added syntax and tooling overhead while the learner focuses on auth, MongoDB, modules, and architecture.

## Problem
Should the codebase stay on TypeScript or switch to JavaScript for easier reading?

## Options considered
1. Keep TypeScript everywhere
2. JavaScript for API only
3. JavaScript (ESM) for both API and web

## Decision
Use **plain JavaScript with ESM** (`"type": "module"`) for both `apps/api` and `apps/web`.

Runtime validation on the API still uses **Zod**. Relative imports in the API use explicit `.js` extensions (Node ESM requirement).

## Consequences
- Easier to follow request flow and domain logic while learning
- No `tsc` / typecheck gate; more reliance on tests and runtime errors
- Can revisit TypeScript later if desired without changing architecture

## Trade-offs
| Gain | Cost |
|------|------|
| Lower cognitive load | No compile-time type errors |
| Fewer configs | Refactors are less guided by the compiler |