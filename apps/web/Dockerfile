# Build stage
FROM oven/bun:1.3.1-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json bun.lock bunfig.toml tsconfig*.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/auth/package.json ./packages/auth/
COPY packages/db/package.json ./packages/db/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY apps/web ./apps/web
COPY packages/auth ./packages/auth
COPY packages/db ./packages/db

# Build the application
WORKDIR /app/apps/web
RUN bun run build

# Production stage
FROM nginx:alpine

WORKDIR /usr/share/nginx/html

# Remove default nginx static assets
RUN rm -rf ./*

# Copy built application from builder
COPY --from=builder /app/apps/web/dist .

# Copy nginx configuration
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Run nginx
CMD ["nginx", "-g", "daemon off;"]
