# ---------- build ----------
FROM node:20-alpine AS build
WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/package.json
COPY apps/web apps/web

# Install all workspace dependencies and hoist modules into a flattened layout
# so the Next binary is available at /app/apps/web/node_modules/next
RUN pnpm install --workspace-root --frozen-lockfile --shamefully-hoist

# As a fallback, also perform a package-local install for the web package so
# that a real `node_modules/next` folder exists at `/app/apps/web/node_modules`.
# This ensures `next build` (which looks for `/app/apps/web/node_modules/next`)
# finds the binary reliably in Docker.
RUN pnpm --prefix apps/web install --frozen-lockfile --shamefully-hoist || true

WORKDIR /app
# Debug: inspect module layout before running build
RUN ls -la /app/apps/web/node_modules || true \
  && ls -la /app/node_modules/next || true \
  && if [ -e /app/apps/web/node_modules/next/dist/bin/next ]; then echo "NEXT BIN FOUND"; ls -la /app/apps/web/node_modules/next/dist/bin || true; else echo "NEXT BIN MISSING"; fi \
  && node -e "try{console.log('RESOLVE NEXT:', require.resolve('next'))}catch(e){console.error('resolve failed', e)}"

# Run the build inside the web package prefix so it uses the package-local
# node_modules installed above.
RUN pnpm --prefix apps/web run build

# ---------- runtime ----------
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=build /app/apps/web/.next/standalone ./
# IMPORTANT: in monorepo, static/public should live under apps/web/*
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /app/apps/web/public ./apps/web/public

EXPOSE 3000
CMD ["node", "apps/web/server.js"]
