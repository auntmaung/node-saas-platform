# Node SaaS Platform

**Production-grade multi-tenant SaaS platform built with Node.js, NestJS, Next.js, PostgreSQL, Redis, and Prisma.**

This repository demonstrates how a real-world SaaS system is designed and implemented: secure authentication, tenant isolation, role-based access control, background processing, observability, testing, and containerized deployment.

---

## Features

### Authentication & Security
- JWT authentication with **access and refresh tokens**
- **Refresh-token rotation** with replay-attack protection
- Password hashing using **argon2**
- Logout (single session and all sessions)

### Multi-Tenancy
- Tenant (organization) model
- Strict tenant data isolation
- Role-based access control (**OWNER / ADMIN / MEMBER**)
- Invitation-based onboarding

### Domain Logic
- Tenant-scoped Projects (CRUD)
- Pagination, filtering, deterministic ordering
- RBAC enforced at API level

### Background Processing
- **BullMQ + Redis** for async jobs
- Worker process for email/invite simulation
- Retries, exponential backoff, dead-letter handling
- Bull Board dashboard for queue inspection

### Observability
- Audit logs for security-sensitive actions
- Request correlation IDs
- Health check endpoints

### Billing Simulation
- Subscription lifecycle (active, canceled)
- Webhook endpoint with signature verification
- Idempotent webhook processing

### Testing
- End-to-end tests using **Jest + Supertest**
- Coverage for:
  - Refresh-token rotation
  - Tenant isolation
  - RBAC enforcement
  - Invitation validation

### Deployment
- Dockerized services:
  - API
  - Web
  - PostgreSQL
  - Redis
- Production-ready Dockerfiles
- One-command startup using Docker Compose

---

## Architecture Overview

```
Browser
  |
  | HTTP
  v
Next.js Web (apps/web)
  |
  | REST
  v
NestJS API (apps/core-api)
  |        |
  |        +--> Redis (BullMQ)
  |              |
  |              v
  |           Worker
  |
  +--> PostgreSQL (Prisma ORM)
```

---

## Tech Stack

- **Backend:** Node.js, NestJS, TypeScript
- **Frontend:** Next.js
- **Database:** PostgreSQL
- **ORM:** Prisma (v7)
- **Queue:** BullMQ + Redis
- **Auth:** JWT, Argon2
- **Testing:** Jest, Supertest
- **Infra:** Docker, Docker Compose
- **Monorepo:** pnpm workspaces

---

## Repository Structure

```
saas-platform/
├─ apps/
│  ├─ core-api/        # NestJS API
│  └─ web/             # Next.js frontend
├─ packages/
├─ scripts/
├─ docker-compose.yaml
├─ package.json
├─ pnpm-workspace.yaml
└─ README.md
```

---

## Getting Started (Local Development)

### Prerequisites
- Node.js 18+
- pnpm
- Docker

### Start infrastructure (PostgreSQL + Redis)
```bash
docker compose up -d db redis
```

### Run API only
```bash
cd apps/core-api
pnpm dev
```

API runs at:
```
http://localhost:4000
```

### Run Web (optional)
```bash
cd apps/web
pnpm dev
```

Web runs at:
```
http://localhost:3000
```

---

## Run Everything with Docker

```bash
docker compose up -d --build
```

Services:
- Web: http://localhost:3000
- API: http://localhost:4000
- Bull Board: http://localhost:4000/admin/queues

---

## Environment Variables

### API (`apps/core-api/.env`)
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/saas
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
ACCESS_TOKEN_TTL_SECONDS=900
REFRESH_TOKEN_TTL_SECONDS=1209600
REDIS_URL=redis://localhost:6379
BILLING_WEBHOOK_SECRET=your-webhook-secret
```

### Web (`apps/web/.env.local`)
```env
CORE_API_BASE_URL=http://localhost:4000
```

---

## Testing

Run end-to-end tests:
```bash
cd apps/core-api
pnpm test:e2e
```

---

## Design Decisions & Tradeoffs
- Tenant isolation enforced at query level instead of database RLS for simplicity.
- Refresh tokens stored hashed; rotation anchored by `jti`.
- Background jobs are at-least-once; idempotency required in production.
- Billing and webhooks are simulated to demonstrate architecture patterns.

---

## Roadmap
- Rate limiting per tenant
- OpenAPI / Swagger documentation
- Structured logging (OpenTelemetry)
- CI pipeline (GitHub Actions)
- Cloud deployment (AWS / Azure)

---

## License
MIT
