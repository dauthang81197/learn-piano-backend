# ─── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies (including devDependencies needed to build)
COPY .npmrc package*.json ./
RUN npm ci

# Copy source and compile TypeScript
COPY . .
RUN npm run build

# Prune devDependencies so only production modules are copied over
RUN npm prune --production

# ─── Stage 2: Production ──────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy pre-built, pre-pruned node_modules (native binaries already compiled)
COPY --from=builder /app/node_modules ./node_modules

# Copy compiled output from builder
COPY --from=builder /app/dist ./dist

EXPOSE 8000

CMD ["node", "dist/main"]

