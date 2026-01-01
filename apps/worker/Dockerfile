# ---------- build ----------
FROM node:20-alpine AS build
WORKDIR /app
RUN corepack enable

# workspace manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# package manifest (for caching)
COPY apps/worker/package.json apps/worker/package.json

# install only worker deps (and any workspace deps it needs)
RUN pnpm install --filter ./apps/worker... --frozen-lockfile

# copy source
COPY apps/worker apps/worker

# build worker
RUN pnpm --filter ./apps/worker... run build

# create a self-contained prod bundle with real node_modules
RUN pnpm --filter ./apps/worker... deploy --prod /out


# ---------- runtime ----------
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /out ./

CMD ["node", "dist/index.js"]
