# Contributing Guide

Thank you for your interest in contributing to **Node SaaS Platform**.  
This project is intended to demonstrate **production-grade Node.js SaaS architecture**, and contributions should reflect that goal.

---

## Code of Conduct

Be respectful, professional, and constructive.  
This project follows standard open-source collaboration norms.

---

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm
- Docker

### Setup
```bash
git clone https://github.com/<your-username>/node-saas-platform.git
cd node-saas-platform
pnpm install
```

Start infrastructure:
```bash
docker compose up -d db redis
```

Run API:
```bash
cd apps/core-api
pnpm dev
```

---

## Project Structure

```
apps/
├─ core-api/   # NestJS API
├─ web/        # Next.js frontend
packages/      # Shared packages
```

---

## Development Guidelines

### General
- Use **TypeScript** everywhere
- Prefer **explicit, readable code** over clever abstractions
- Follow existing patterns and naming conventions

### Backend (NestJS)
- Keep modules small and focused
- Enforce tenant isolation in every query
- Validate inputs using DTOs and class-validator
- Do not bypass RBAC guards

### Prisma
- Update `schema.prisma` intentionally
- Always run:
  ```bash
  pnpm prisma generate
  pnpm prisma migrate dev
  ```
- Never edit migration files manually

### Authentication & Security
- Never log secrets or tokens
- Preserve refresh-token rotation guarantees
- All security-sensitive changes must include tests

---

## Testing

Before opening a PR:
```bash
cd apps/core-api
pnpm test:e2e
```

All tests must pass.

---

## Commits

Use clear, meaningful commit messages:
```
feat: add tenant audit logging
fix: prevent refresh token replay
chore: update docker configuration
```

---

## Pull Requests

1. Fork the repository
2. Create a feature branch
3. Keep PRs small and focused
4. Describe *why* the change is needed
5. Reference relevant issues if applicable

---

## What This Project Is / Is Not

**This project IS:**
- A reference SaaS backend architecture
- A learning and showcase project

**This project is NOT:**
- A production service
- A feature-complete SaaS product

---

## Questions

If you have questions or suggestions, feel free to open an issue.

Thank you for contributing.
