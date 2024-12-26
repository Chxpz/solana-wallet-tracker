#!/bin/bash
set -e

echo "🔄 Waiting for PostgreSQL to be ready..."
until pg_isready -h postgres -p 5432 -U admin; do
  sleep 1
done

echo "✅ PostgreSQL is ready. Running migrations..."

# Passa a senha corretamente usando PGPASSWORD
export PGPASSWORD=password

# Executa as migrações
psql -h postgres -U admin -d solana_db -f /app/db/init/001_create_tokens_table.sql || echo "✅ Table tokens already exists"
psql -h postgres -U admin -d solana_db -f /app/db/init/002_create_wallet_tokens_table.sql || echo "✅ Table wallet_tokens already exists"

unset PGPASSWORD

echo "🚀 Starting application..."
npm run start
