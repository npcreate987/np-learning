#!/usr/bin/env bash
# NP Learning — push code to GitHub (run in YOUR Terminal, not in Cursor)
# Cursor's sandbox blocks creating .git, so run this locally once.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

bold() { printf "\033[1m%s\033[0m\n" "$1"; }

bold "=== NP Learning → GitHub ==="

if [ ! -d .git ]; then
  git init -b main
  echo "git initialized"
fi

git add -A

# Safety: make sure no secrets are staged
if git diff --cached --name-only | grep -E '(^|/)\.env$|\.env\.local$'; then
  echo "ERROR: พบไฟล์ .env ใน staging — ตรวจ .gitignore ก่อน push"
  exit 1
fi

git commit -m "NP Learning: LMS + AI Tutor + Community + Quiz/Cert + TikTok classes" || echo "ไม่มีอะไรใหม่ให้ commit"

echo ""
bold "สร้าง repo ว่างบน https://github.com/new (อย่าติ๊ก README/gitignore)"
read -rp "วาง URL ของ repo (เช่น https://github.com/USER/np-learning.git): " REPO_URL

if [ -z "$REPO_URL" ]; then
  echo "ยกเลิก: ไม่ได้ใส่ URL"
  exit 1
fi

git remote remove origin 2>/dev/null || true
git remote add origin "$REPO_URL"
git push -u origin main

echo ""
bold "เสร็จ! โค้ดขึ้น GitHub แล้ว → ไปต่อที่ DEPLOY.md (Vercel + Railway)"
