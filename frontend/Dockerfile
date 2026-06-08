# ── Frontend Dockerfile ──────────────────────────────────────
# Stage 1: build the React app
FROM node:20-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci                  # clean install — faster and more reliable than npm install

COPY . .
RUN npm run build           # outputs to /app/dist

# Stage 2: serve with Nginx (tiny, production-grade)
FROM nginx:alpine

# Copy built app into Nginx's serve directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx config — needed for React Router (client-side routing)
# Without this, refreshing any route other than / gives a 404
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
