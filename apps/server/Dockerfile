# Build stage
FROM oven/bun:1.3.1-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json bun.lock bunfig.toml tsconfig*.json ./
COPY apps/server/package.json ./apps/server/
COPY packages/auth/package.json ./packages/auth/
COPY packages/db/package.json ./packages/db/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY apps/server ./apps/server
COPY packages/auth ./packages/auth
COPY packages/db ./packages/db

# Build the application
WORKDIR /app/apps/server
RUN bun run build

# Production stage
FROM oven/bun:1.3.1-alpine

WORKDIR /app

# Copy built application
COPY --from=builder /app/apps/server/dist ./dist
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/server/package.json ./

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD bun run -e "fetch('http://localhost:3000/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Run the application
CMD ["bun", "run", "start"]
