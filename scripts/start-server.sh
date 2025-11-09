#!/bin/sh
set -e

echo "🚀 Starting server initialization..."

# Install dependencies
echo "📦 Installing dependencies..."
bun install

# Navigate to db package
cd /app/packages/db

# Generate Prisma Client
echo "🔨 Generating Prisma Client..."
bun run db:generate

# Push database schema (creates tables if they don't exist)
echo "🗄️  Pushing database schema..."
bun run db:push

# Seed database
echo "🌱 Seeding database..."
bun run db:seed || echo "⚠️  Seeding skipped or failed (this is ok if data already exists)"

# Go back to root
cd /app

# Start the server
echo "✅ Starting development server..."
bun run dev:server
