# 🧱 Moru — AI Coding Agent (10× Developer Productivity)

## 🎯 Vision

**Long-term Goal**

> Build an _agentic software engineer_ that can 10× my productivity.  
> More quality software → more human productivity → more human value.

**Short-term Goal**

> Produce software automatically — even while I’m sleeping.

**Immediate Goal**

> Run Codex in GitHub/GitLab + my own environment as a background coding agent.

---

## 🧩 MVP Specification

### 🔹 Spawn Agents from Web UI

- Chat-style interface to request coding tasks.
- Select number of variations to generate.
- Choose base branch for the task.

### 🔹 Code Generation & Management

- Agents create diffs viewable directly in the web UI.
- Create or update Pull Requests (buttons: _Create PR_, _Update PR_).
- Continue updating existing branches when the chat thread continues.
- Refine or adjust code via chat feedback loop.

### 🔹 GitHub Integration (Phase 1)

- Authenticate with **OAuth** or **PAT**.
- Securely **clone repos** (read/write).
- Create **commits**, **branches**, and **PRs**.
- **GitLab** support will follow after GitHub rollout.

---

## 🧱 Architecture Overview

| Layer               | Responsibility                                                                                                  |
| ------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Client (Web)**    | React Router app (Tailwind, shadcn/ui, Motion, Heroicons). Handles chat UI, branch selection, and diff display. |
| **Clerk**           | Authentication and session management; exposes sign-in flows and user context to the client + backend.          |
| **Convex**          | Control plane — manages job table, statuses, enqueue/report/heartbeat actions.                                  |
| **Worker (Server)** | BullMQ worker that spawns containerized agents. Runs Codex jobs and reports results.                            |
| **Executor**        | Sandbox runtime abstraction — **Docker** for now, **Firecracker/gVisor** later.                                 |
| **Redis (BullMQ)**  | Queue backend for job enqueue → execution flow.                                                                 |
| **GitHub API**      | Repo access for branch, commit, and PR operations.                                                              |

---

## ⚙️ Tech Stack

- **Package Manager:** pnpm (monorepo workspace)
- **Node.js Version:** Latest stable release (install via nvm; keep synced with Current channel)
- **Frontend:** React Router Framework, TailwindCSS, shadcn/ui, Heroicons, Framer Motion
- **Auth:** Clerk (managed auth flows, user identity, and session tokens)
- **Fonts:** Inter, Geist, IBM Plex Sans, Mona Sans, Manrope
- **Backend:** Convex (serverless control plane) + Node (BullMQ)
- **Queue:** BullMQ (Redis)
- **Container Runtime:** Docker (via `dockerode`)
- **Future Sandbox:** Firecracker / gVisor

---

## 🧩 Monorepo Structure

```
moru/
├─ apps/
│  ├─ web/        # Serverless SSR app (React Router)
│  ├─ backend/    # Convex project (control plane)
│  │  └─ convex/  # schema.ts, functions/*, _generated/*
│  └─ worker/     # Enqueue API + BullMQ worker + executor
├─ pnpm-workspace.yaml
├─ tsconfig.base.json
└─ (optional) turbo.json, .env.example, infra/
```

### Each App's Role

- **apps/web** → UI layer. Calls Convex `createJob`, POSTs `/internal/enqueue`, imports `@moru/convex/_generated/*`.
- **apps/backend** → Owns schema/functions. Exposes generated API/types used by other apps via `_generated` artifacts.
- **apps/worker** → Hosts `/internal/enqueue` → BullMQ → consumes jobs → reports via Convex actions.

### Convex Generated Modules

- Run `pnpm codegen` after any schema change to refresh `apps/backend/convex/_generated/*`.
- Web and worker import those modules via the alias `@moru/convex/_generated/*` configured in their bundlers/tsconfigs.

---

## 🧰 Build & Deploy

| Component                       | Deployment Target          |
| ------------------------------- | -------------------------- |
| **Convex**                      | Convex Cloud               |
| **Web (SSR)**                   | Netlify                    |
| **Worker (Enqueue + Executor)** | EC2                        |
| **Redis**                       | Upstash                    |
| **Container Images**            | ECR                        |
| **Object Storage**              | S3 / R2 (logs & artifacts) |

**CI/CD Path Filtering**

- Backend (Convex) deploys when: `apps/backend/**`
- Web deploys when: `apps/web/**`, `apps/backend/convex/_generated/**`
- Worker deploys when: `apps/worker/**`, `apps/backend/convex/_generated/**`

Each deploys **independently** for modular iteration.

---

## ⚖️ Constraints

- Supports **Codex** model first (Claude Code later).
- **GitHub first**, GitLab next.
- **No Slack or Code Review agent** in MVP — web interface only.

---

## 🧭 Deployment Targets Summary

| Component                       | Deployment Target |
| ------------------------------- | ----------------- |
| **Convex**                      | Convex Cloud      |
| **Web (SSR)**                   | Vercel            |
| **Worker (Enqueue + Executor)** | EC2               |
| **Redis**                       | Upstash           |
| **Container Images**            | ECR               |
| **Object Storage**              | S3 / R2           |

---

## 🖼️ Design References

To understand the UI structure and visual layout, see screenshots under:

```
references/imgs/codex-screenshots
```
