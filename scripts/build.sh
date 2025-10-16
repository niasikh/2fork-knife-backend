#!/bin/bash
set -e

echo "🔧 Installing dependencies..."
npm ci

echo "📊 Generating Prisma client..."
npx prisma generate

echo "🏗️ Building application..."
npx nest build

echo "✅ Build complete!"
