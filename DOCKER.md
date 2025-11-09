# Docker Setup Guide

This guide explains how to run the project using Docker with hot-reload support for development.

## Prerequisites

- Docker Engine 20.10 or higher
- Docker Compose V2

## Quick Start

### Development Mode (Hot Reload)

Run the entire stack in development mode with volume mounting for instant code changes:

```bash
# Start all services (postgres, server, web)
bun run docker:dev

# Or with rebuild
bun run docker:dev:build

# View logs
bun run docker:dev:logs

# Stop services
bun run docker:dev:down
```

**What happens:**
- PostgreSQL runs on `localhost:5678`
- Server API runs on `localhost:3000` with hot-reload
- Web app runs on `localhost:3001` with hot-reload
- All code changes in your local files are instantly reflected in containers

### Production Mode

Build and run optimized production containers:

```bash
# Build images
bun run docker:build

# Start services in detached mode
bun run docker:up

# View logs
bun run docker:logs

# Stop services
bun run docker:down

# Clean everything (including volumes)
bun run docker:clean
```

## Architecture

### Development Setup (`docker-compose.dev.yml`)

- **postgres**: PostgreSQL 16 database
- **server**: Bun runtime with hot-reload (`--hot` flag)
- **web**: Vite dev server with HMR

Volume mounts:
- `./:/app` - Entire project mounted for instant code updates
- Anonymous volumes for `node_modules` to prevent permission issues

### Production Setup (`docker-compose.yml`)

- **postgres**: Same as development
- **server**: Multi-stage build with optimized Bun runtime
- **web**: Nginx serving static build with reverse proxy

## Environment Variables

Create `.env` files in respective directories:

### apps/server/.env
```
DATABASE_URL=postgresql://postgres:password@localhost:5678/project-base
PORT=3000
```

### apps/web/.env
```
VITE_API_URL=http://localhost:3000
```

## Useful Commands

### Development

```bash
# Start only specific service
docker compose -f docker-compose.dev.yml up postgres
docker compose -f docker-compose.dev.yml up server
docker compose -f docker-compose.dev.yml up web

# Rebuild specific service
docker compose -f docker-compose.dev.yml up --build server

# Execute command in running container
docker compose -f docker-compose.dev.yml exec server bun --version
docker compose -f docker-compose.dev.yml exec web bun run check-types

# Shell into container
docker compose -f docker-compose.dev.yml exec server sh
docker compose -f docker-compose.dev.yml exec web sh
```

### Database Management

```bash
# Run Prisma migrations
docker compose -f docker-compose.dev.yml exec server bun run --filter @project-base/db db:push

# Open Prisma Studio
docker compose -f docker-compose.dev.yml exec server bun run --filter @project-base/db db:studio

# Seed database
docker compose -f docker-compose.dev.yml exec server bun run --filter @project-base/db db:seed
```

### Cleanup

```bash
# Remove stopped containers
docker compose -f docker-compose.dev.yml down

# Remove containers and volumes
docker compose -f docker-compose.dev.yml down -v

# Remove everything including images
docker compose -f docker-compose.dev.yml down -v --rmi all
```

## Troubleshooting

### Port Already in Use

If ports are already occupied:

```bash
# Change ports in docker-compose.dev.yml
# For example, change "3000:3000" to "3002:3000"
```

### Permission Issues

On Linux, if you encounter permission issues:

```bash
# Run with your user ID
docker compose -f docker-compose.dev.yml run --user $(id -u):$(id -g) server bun install
```

### Hot Reload Not Working

1. Ensure your files are being saved
2. Check if volumes are mounted correctly:
   ```bash
   docker compose -f docker-compose.dev.yml exec server ls -la /app
   ```
3. Restart the service:
   ```bash
   docker compose -f docker-compose.dev.yml restart server
   ```

### Database Connection Issues

1. Wait for postgres to be healthy:
   ```bash
   docker compose -f docker-compose.dev.yml ps
   ```
2. Check database logs:
   ```bash
   docker compose -f docker-compose.dev.yml logs postgres
   ```

## Performance Tips

### Development

- Use native file system mounting (faster on macOS/Linux)
- Use `:cached` or `:delegated` flags on macOS for better performance
- Limit the number of files being watched

### Production

- Multi-stage builds keep images small
- Alpine-based images for minimal size
- Health checks ensure services are ready

## CI/CD Integration

### Build and Push

```bash
# Build production images
docker compose build

# Tag and push to registry
docker tag project-base-server your-registry/project-base-server:latest
docker tag project-base-web your-registry/project-base-web:latest
docker push your-registry/project-base-server:latest
docker push your-registry/project-base-web:latest
```

## Next Steps

- Configure environment-specific variables
- Set up Docker secrets for sensitive data
- Add monitoring and logging solutions
- Configure reverse proxy (Traefik, Nginx) for production
- Set up automated backups for PostgreSQL
