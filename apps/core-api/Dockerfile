FROM node:20-bookworm-slim AS build
WORKDIR /app
RUN corepack enable

COPY . .

# Install all workspace deps properly (dev deps included)
RUN pnpm -w install --frozen-lockfile

# Prisma v7 config needs DATABASE_URL present during generate
ENV DATABASE_URL=postgresql://postgres:postgres@localhost:5432/saas?schema=public

WORKDIR /app/apps/core-api

RUN pnpm prisma generate --schema=./prisma/schema.prisma --config=./prisma.config.ts
RUN mkdir -p /prisma-output && find /app/node_modules/.pnpm -type d -name '.prisma' -exec cp -r {} /prisma-output/ \; || true

# Use the nest binary that exists in the pnpm virtual store
RUN /app/node_modules/.pnpm/node_modules/.bin/nest build

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable
RUN apt-get update -y && apt-get install -y openssl --no-install-recommends && rm -rf /var/lib/apt/lists/*

# Install prod deps only (optional but recommended)
COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./
COPY apps/core-api/package.json apps/core-api/package.json
RUN pnpm -w install --frozen-lockfile

COPY --from=build /app/apps/core-api/dist ./apps/core-api/dist
COPY --from=build /app/apps/core-api/prisma ./apps/core-api/prisma
COPY --from=build /app/apps/core-api/prisma.config.ts ./apps/core-api/prisma.config.ts
COPY --from=build /prisma-output/.prisma ./node_modules/.prisma
RUN pnpm --filter ./apps/core-api exec prisma generate --schema=./prisma/schema.prisma --config=./prisma.config.ts

WORKDIR /app/apps/core-api
EXPOSE 4000

CMD ["sh","-c","pnpm prisma migrate deploy --schema=./prisma/schema.prisma --config=./prisma.config.ts && node dist/src/main.js"]
