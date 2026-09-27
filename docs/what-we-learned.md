# What we learned

Open this file when you want the explanation again. Each section is the lesson in plain language: the problem, how FlowHub does it, where the code lives, and the trade-off.

`docs/learning-log.md` is the phase checklist (status, interview questions). This file is the explanation.

Agents: when you teach a concept, add or update a section here in the same change, and add a line to the index. Put new lessons at the bottom.

## Index

- [Modular monolith](#modular-monolith)
- [One process, one database](#one-process-one-database)
- [Access tokens and refresh tokens](#access-tokens-and-refresh-tokens)
- [Why the refresh token is hashed](#why-the-refresh-token-is-hashed)
- [Refresh-token rotation and reuse](#refresh-token-rotation-and-reuse)
- [The refresh cookie](#the-refresh-cookie)
- [Password hashing](#password-hashing)
- [Authorization lives in the service](#authorization-lives-in-the-service)
- [Health versus ready](#health-versus-ready)
- [Fail fast on bad config](#fail-fast-on-bad-config)
- [Errors and request ids](#errors-and-request-ids)
- [Indexes follow the query](#indexes-follow-the-query)
- [Copying workspaceId onto a task](#copying-workspaceid-onto-a-task)
- [Offset pagination](#offset-pagination)

---

## Modular monolith

A modular monolith is one program you deploy, split into folders that match the product: auth, users, organizations, workspaces, projects, tasks, comments. Each folder owns its routes, its data, and its rules. Shared pieces (errors, logging, the database connection) sit outside those folders.

We chose this for the first version because FlowHub does not yet have a problem that separate services would solve. Membership and "who can see this task" can be checked with a normal function call and one database. Microservices would add network failures and "which service owns the user" questions before those rules are proven.

The routes are mounted in `apps/api/src/app.js`. Domain code lives under `apps/api/src/modules/`.

Trade-off: one process is easy to run and debug. Every module also fails and scales together. We split a module out only when a concrete limit shows up.

## One process, one database

The API is a single Node process. MongoDB is the only database. The browser talks to Express over `/api/v1`. There is no Redis, queue, or second service in this version.

That shape is in `apps/api/src/index.js` (start the process) and `apps/api/src/infrastructure/database/mongo.js` (connect). If the first connection fails, the process does not boot.

Trade-off: you can trace a request in one codebase. You cannot scale the task list independently of login.

## Access tokens and refresh tokens

Login returns two credentials with different jobs.

The access token is a short-lived JWT (default 15 minutes). The client sends it as `Authorization: Bearer …` on each API call. The server checks the signature and expiry. It does not look the token up in the database, so any API instance can accept it. That is what "stateless" means here: no session row to share before we run more than one instance.

The refresh token lasts longer (default 7 days). It exists so the user is not asked to type a password every 15 minutes. It is not sent on ordinary task requests.

Signing and checking live in `apps/api/src/modules/auth/tokens.js`. The two tokens use different secrets (`JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` in `apps/api/src/config/env.js`), so a leaked access secret cannot mint refresh tokens.

Trade-off: a stolen access token works until it expires. We keep that window short because we cannot revoke a stateless access token without storing it.

## Why the refresh token is hashed

The refresh token is stored in MongoDB, but only as a SHA-256 hash (`hashToken` in `tokens.js`, saved by `issueSession` in `auth.service.js`). The raw token goes to the browser. The database row holds `tokenHash`.

If someone copies the database, they get hashes, not tokens they can send back to `/api/v1/auth/refresh`. A hash is one-way: you can check a presented token by hashing it again and comparing, and you cannot turn the stored hash back into the token.

Trade-off: we cannot show the user "here is your current refresh token" from the database. We do not need to.

## Refresh-token rotation and reuse

Each successful refresh does three things in `auth.service.js` `refresh`:

1. Hash the presented token and load that row.
2. If the row is already revoked, revoke every still-active refresh token for that user and reject the request. Seeing a dead token again means it was stolen and replayed, or the client retried an old one.
3. If the row is valid, mark it revoked and issue a brand-new access token and refresh token (`issueSession`).

Logout revokes the current refresh row and clears the cookie. It does not revoke the access token, which simply expires.

Trade-off: every refresh writes to the database. That write is what makes logout and reuse detection possible. A refresh token that was only a JWT, with nothing stored, could not be revoked.

## The refresh cookie

The refresh token is set as the `refreshToken` cookie in `auth.controller.js`. The cookie is `httpOnly`, so page JavaScript cannot read it. `sameSite` is `lax`. `secure` is on only when `NODE_ENV` is `production`, so local HTTP still works. The cookie path is `/api/v1/auth`, so the browser attaches it to login, refresh, and logout, not to every task request.

The JSON body returns the user and the access token. The refresh token stays in the cookie.

The controller also accepts a refresh token in the JSON body if the cookie is missing. That is a second door into the same `refresh` function.

Trade-off: `httpOnly` blocks a script on the page from stealing the refresh token. It does not stop a request the browser itself sends, which is why `sameSite` and the narrow path exist.

## Password hashing

Passwords are not stored. `password.js` runs bcrypt with cost 12 and saves `passwordHash` on the user. Login loads that hash and calls `bcrypt.compare`. Cost 12 means the hash is slow on purpose, so guessing passwords from a stolen database is expensive.

A duplicate email hits the unique index on `users.email` and becomes a 409 from `register`.

Trade-off: signup and login spend CPU on the hash. That cost is the protection.

## Authorization lives in the service

A route being "logged in" is not the same as being allowed to see a workspace. `authenticate` proves the access token. The service then checks membership. Example: `resolveWorkspaceAccess` in `workspaceAccess.js` loads the workspace and the membership before a workspace action proceeds. Task access goes through the task's workspace.

Controllers stay thin: read the request, call the service, send the response. The allow-or-deny rule sits next to the write, in the service, so a second route cannot forget it as easily.

Trade-off: every service method must remember to call the access helper. Folder names do not enforce that. Cross-module code should use models and those helpers, not another module's service.

## Health versus ready

`GET /health` always returns ok if the process is up. `GET /ready` returns 503 when MongoDB is not connected (`isMongoReady` in `app.js`).

A process that is alive but cannot reach the database should not receive traffic. Health answers "is the process running?" Ready answers "can it do work?"

Trade-off: nothing sits in front of the API yet to act on `/ready`. The split is in place for when a load balancer does.

## Fail fast on bad config

`env.js` checks the environment with Zod before the rest of the app uses it. A missing `MONGODB_URI`, or a JWT secret shorter than 16 characters, throws at startup. The process refuses to boot.

Finding a bad secret on the first request, after users are hitting the API, is worse than refusing to start.

Trade-off: a typo in `.env` stops the server immediately. That is the point.

## Errors and request ids

Failures use one shape: `{ error: { code, message, requestId } }`. Unknown routes in `app.js` use it. `requestId` middleware stamps an id on the request, and the request log line includes that id, method, path, status, and duration.

When a user reports a failure, the id in the response is the same id in the log line.

Trade-off: clients must read `error.code`, not a pile of different body shapes. One shape is the constraint.

## Indexes follow the query

An index is a side structure MongoDB keeps so a filter does not scan every document. We add one for a query we actually run.

Tasks are listed by project and status, newest first: `{ projectId: 1, status: 1, createdAt: -1 }` on `task.model.js`. Tasks by assignee use `{ assigneeId: 1, status: 1 }`. Activity-style reads use `{ workspaceId: 1, updatedAt: -1 }`. Email is unique. A person can be in a workspace once: `{ workspaceId: 1, userId: 1 }` is unique on workspace members.

Trade-off: every index speeds a read and slows writes, and it uses disk. An index that matches no query is pure cost.

## Copying workspaceId onto a task

A task belongs to a project, and a project belongs to a workspace. The task document also stores `workspaceId` itself (`task.model.js`, set in `tasks.service.js` from the project).

Reads such as "recent tasks in this workspace" can filter on the task collection alone. They do not load projects first to discover which tasks qualify. Access checks use that same field to reach workspace membership.

Trade-off: the writer must copy `workspaceId` and keep it correct. If a task's project moved and the copy was not updated, the task would show up in the wrong workspace.

## Offset pagination

List endpoints take `page` and `limit`. The service skips `(page - 1) * limit` documents and returns the next page, with a maximum of 100. You can see this on workspace and task lists (`skip` / `limit` in the services).

Page 1 is easy to explain: skip 0, take 20. Deep pages get slower because the database still walks the skipped documents.

Trade-off: this is enough while lists are small. A cursor ("give me tasks after this id") stays fast on large lists and is the later replacement, not the first one.
