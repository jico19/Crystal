# Multi-stage Dockerfile for Crystal API
FROM node:22-alpine AS builder

WORKDIR /app

# Copy root and workspace manifests
COPY package.json package-lock.json ./
COPY packages/types/package.json ./packages/types/
COPY packages/validation/package.json ./packages/validation/
COPY apps/api/package.json ./apps/api/

# Install workspace dependencies
RUN npm ci

# Copy package source code
COPY packages/types ./packages/types
COPY packages/validation ./packages/validation
COPY apps/api ./apps/api

# Build API TypeScript output
RUN npm run build --workspace=@crystal/api

# -------------------------------------------------------------
# Runner Stage
# -------------------------------------------------------------
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000

RUN apk add --no-cache curl

# Copy production workspace artifacts
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/types ./packages/types
COPY --from=builder /app/packages/validation ./packages/validation
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules

USER node

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:4000/health || exit 1

CMD ["node", "apps/api/dist/server.js"]
