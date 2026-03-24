FROM node:20-bookworm-slim
WORKDIR /app
RUN corepack enable
RUN apt-get update -y && apt-get install -y openssl --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Workspace manifests — separate layer for caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/core-api/package.json apps/core-api/package.json

RUN pnpm install --frozen-lockfile

COPY apps/core-api apps/core-api

# Prisma v7 config reads DATABASE_URL; placeholder is fine for generate
ENV DATABASE_URL=postgresql://x:x@localhost:5432/saas
ENV NODE_ENV=production

RUN pnpm --filter core-api exec prisma generate \
      --schema=./prisma/schema.prisma \
      --config=./prisma.config.ts

RUN pnpm --filter core-api build

EXPOSE 4000
CMD ["sh", "-c", \
  "pnpm --filter core-api exec prisma migrate deploy \
     --schema=./prisma/schema.prisma \
     --config=./prisma.config.ts \
  && node apps/core-api/dist/src/main.js"]
