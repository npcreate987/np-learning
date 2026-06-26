#!/bin/bash
cd "$(dirname "$0")"
export PATH="$HOME/.local/bin:/usr/local/bin:/Applications/Docker.app/Contents/Resources/bin:$PATH"
bash scripts/start-demo.sh
echo ""
read -p "กด Enter เพื่อปิดหน้าต่างนี้..."
