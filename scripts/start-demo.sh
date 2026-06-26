#!/usr/bin/env bash
# NP Learning — one-shot local demo (Postgres + API + Web)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export PATH="$HOME/.local/bin:/usr/local/bin:$PATH"
export XDG_CACHE_HOME="$ROOT/.cache"
mkdir -p "$XDG_CACHE_HOME"

echo "==> 1/6 Install pnpm (if missing)"
if ! command -v pnpm >/dev/null 2>&1; then
  if command -v corepack >/dev/null 2>&1; then
    corepack enable || true
    corepack prepare pnpm@9.15.0 --activate || npm install -g pnpm
  else
    npm install -g pnpm
  fi
fi
pnpm -v

echo "==> 2/6 Install dependencies"
pnpm install

echo "==> 3/6 Start Postgres (Docker)"
DOCKER_BIN="/Applications/Docker.app/Contents/Resources/bin/docker"
if [ -x "$DOCKER_BIN" ]; then
  DOCKER="$DOCKER_BIN"
  export PATH="$(dirname "$DOCKER_BIN"):$PATH"
else
  DOCKER="${DOCKER:-docker}"
fi
if ! $DOCKER info >/dev/null 2>&1; then
  echo "Docker ยังไม่พร้อม — กำลังเปิด Docker Desktop..."
  open -a Docker 2>/dev/null || true
  for i in $(seq 1 60); do
    if $DOCKER info >/dev/null 2>&1; then
      echo "Docker พร้อมแล้ว"
      break
    fi
    sleep 2
    if [ "$i" -eq 60 ]; then
      echo "ERROR: เปิด Docker Desktop ด้วยตัวเอง รอจน Running แล้วรันสคริปต์นี้อีกครั้ง"
      exit 1
    fi
  done
fi
$DOCKER compose up -d
echo "รอ Postgres..."
for i in $(seq 1 30); do
  if $DOCKER compose exec -T postgres pg_isready -U learn -d learn >/dev/null 2>&1; then
    echo "Postgres พร้อม"
    break
  fi
  sleep 1
  if [ "$i" -eq 30 ]; then
    echo "ERROR: Postgres ไม่ขึ้นในเวลาที่กำหนด"
    exit 1
  fi
done

echo "==> 4/6 Database migrate + seed"
cd "$ROOT/apps/api"
pnpm prisma:generate
pnpm exec prisma migrate deploy
pnpm prisma:seed

echo "==> 5/6 Build API (ถ้ายังไม่มี dist)"
pnpm build 2>/dev/null || true

echo "==> 6/6 Start servers"
# Kill old NP processes on 4000/3100 if ours
for port in 4000 3100; do
  pid=$(lsof -ti tcp:"$port" 2>/dev/null || true)
  if [ -n "$pid" ]; then
    kill "$pid" 2>/dev/null || true
    sleep 1
  fi
done

cd "$ROOT/apps/api"
pnpm start:prod > /tmp/np-api.log 2>&1 &
API_PID=$!
echo "API PID $API_PID (log: /tmp/np-api.log)"

cd "$ROOT/apps/web"
export NEXT_DIST_DIR="${NEXT_DIST_DIR:-devnext6}"
if [ ! -d "$NEXT_DIST_DIR" ]; then
  pnpm build
fi
pnpm start > /tmp/np-web.log 2>&1 &
WEB_PID=$!
echo "Web PID $WEB_PID (log: /tmp/np-web.log)"

sleep 3
echo ""
echo "=========================================="
echo "  NP Learning พร้อมแล้ว"
echo "  Web:  http://localhost:3100/login"
echo "  API:  http://localhost:4000/api/health"
echo ""
echo "  เข้าระบบ: กดปุ่ม นักเรียน / ผู้สอน / แอดมิน"
echo "  (ไม่ต้องพิมพ์รหัสผ่าน)"
echo "=========================================="
echo ""
curl -sf "http://localhost:4000/api/health" && echo " API OK" || echo " API ยังไม่พร้อม — ดู /tmp/np-api.log"
curl -sf -o /dev/null -w "Web HTTP %{http_code}\n" "http://localhost:3100/login"
