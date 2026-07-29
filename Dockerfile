FROM node:20-alpine

WORKDIR /app

# Install dependencies first (layer caching)
COPY app/package.json app/package-lock.json ./
RUN npm ci

# Copy application source
COPY app/ .

# Copy .env.example as default .env (override at runtime with docker-compose)
RUN cp .env.example .env

# Vite dev server
EXPOSE 5173
# Express API server
EXPOSE 3001

# Override the dev script so Vite binds to all interfaces (0.0.0.0)
# This makes the site reachable from the host's LAN IP, not just localhost
CMD ["npx", "concurrently", "vite --host 0.0.0.0", "node server/index.js"]
