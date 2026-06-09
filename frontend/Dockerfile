# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Pass at build time; defaults to /api so nginx proxies to the backend
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

# Install dependencies (cached unless package files change)
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# ── Stage 2: Serve ──────────────────────────────────────────────────────────
FROM nginx:alpine

# Copy compiled assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Custom nginx config (SPA routing + API proxy)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
