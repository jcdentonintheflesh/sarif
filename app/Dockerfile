# ── Build stage ───────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ── Production stage ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

RUN addgroup -g 1001 -S sarif && adduser -S sarif -u 1001 -G sarif
WORKDIR /app

# Production dependencies only
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Built frontend
COPY --from=builder /app/dist ./dist

# Server
COPY server/ ./server/

# Data directory (mounted as volume in production)
RUN mkdir -p /app/data && chown sarif:sarif /app/data

USER sarif

EXPOSE 3001

CMD ["node", "server/index.js"]
