#!/bin/sh
set -e

echo "[start] cwd=$(pwd) node=$(node -v)"
echo "[start] running prisma migrate deploy..."
npx prisma migrate deploy
echo "[start] migrate done, starting API..."
exec node dist/main.js
