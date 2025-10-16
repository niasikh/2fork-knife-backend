#!/usr/bin/env bash
set -e

echo "🚀 Fork & Knife Backend - Starting..."

# Run database migrations
echo "📊 Running database migrations..."
npx prisma migrate deploy

echo "✅ Migrations complete"

# Start the application
echo "🎯 Starting application..."
exec node dist/main.js

