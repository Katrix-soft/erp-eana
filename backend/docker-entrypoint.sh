#!/bin/sh
set -e

echo "🚀 EANA ERP - Starting Backend Container"
echo "========================================"

# Wait for database to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
until wget --spider -q http://postgres:5432 2>/dev/null || nc -z postgres 5432; do
  echo "   PostgreSQL is unavailable - sleeping"
  sleep 2
done
echo "✅ PostgreSQL is ready!"

# Wait for Redis to be ready
echo "⏳ Waiting for Redis to be ready..."
until wget --spider -q http://redis:6379 2>/dev/null || nc -z redis 6379; do
  echo "   Redis is unavailable - sleeping"
  sleep 2
done
echo "✅ Redis is ready!"

# Run bootstrap (data initialization)
echo ""
echo "📦 Running Bootstrap (Database Initialization)..."
echo "================================================"
npm run bootstrap:prod -- --all

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Bootstrap completed successfully!"
    echo ""
else
    echo ""
    echo "❌ Bootstrap failed! Check logs above."
    exit 1
fi

# Start the main application
echo "🎯 Starting NestJS Application..."
echo "=================================="
exec node dist/main.js
