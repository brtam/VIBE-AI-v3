# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (layer cache)
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Copy source and build the React app
COPY . .
RUN npm run build

# ── Stage 2: production ────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Only install production dependencies
COPY package*.json ./
RUN npm ci --omit=dev --legacy-peer-deps

# Copy server source and React build output
COPY server/ ./server/
COPY tsconfig*.json ./
COPY --from=builder /app/dist ./dist

# tsx is a dev dependency, install it separately for running TS server
RUN npm install tsx --legacy-peer-deps

EXPOSE 3000

CMD ["node", "--import", "tsx/esm", "server/index.ts"]
