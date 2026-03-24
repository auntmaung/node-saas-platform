FROM node:20-bookworm-slim AS build
WORKDIR /app
RUN corepack enable

# Workspace manifests — separate layer for caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/core-api/package.json apps/core-api/package.json

RUN pnpm install --frozen-lockfile

COPY apps/core-api apps/core-api

# Prisma v7 needs DATABASE_URL at generate time
ENV DATABASE_URL=postgresql://x:x@localhost:5432/saas

RUN pnpm --filter core-api exec prisma generate \
      --schema=./prisma/schema.prisma \
      --config=./prisma.config.ts

RUN pnpm --filter core-api build

# ---------- runtime ----------
FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable
RUN apt-get update -y && apt-get install -y openssl --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/core-api/package.json apps/core-api/package.json

# Install all deps (prisma CLI needed for migrate deploy at startup)
RUN pnpm install --frozen-lockfile --filter core-api...

COPY --from=build /app/apps/core-api/dist         apps/core-api/dist
COPY --from=build /app/apps/core-api/prisma        apps/core-api/prisma
COPY --from=build /app/apps/core-api/prisma.config.ts apps/core-api/prisma.config.ts
COPY --from=build /app/node_modules/.prisma        node_modules/.prisma

WORKDIR /app/apps/core-api
EXPOSE 4000
CMD ["sh", "-c", \
  "pnpm prisma migrate deploy --schema=./prisma/schema.prisma --config=./prisma.config.ts \
  && node dist/src/main.js"]
