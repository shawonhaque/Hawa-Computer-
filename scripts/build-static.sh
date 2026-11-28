#!/usr/bin/env bash
# Builds the static copy used for GitHub Pages (served from a sub-path or a custom domain).
# Usage: BASE_PATH=/Hawa-Computer- ./scripts/build-static.sh
set -euo pipefail

BASE_PATH="${BASE_PATH:-/Hawa-Computer-}"
SRC="$(cd "$(dirname "$0")/.." && pwd)"
WORK="${WORK:-/tmp/hawa-static}"

rm -rf "$WORK"
mkdir -p "$WORK"
cd "$SRC"
tar -cf - --exclude=node_modules --exclude=.git --exclude=.next --exclude=storage . | (cd "$WORK" && tar -xf -)
ln -sfn "$SRC/node_modules" "$WORK/node_modules"

cd "$WORK"
# The origin serves the previous build from memory, so stop it and wait until the
# port is free; otherwise the crawl silently publishes stale HTML.
ps -eo pid,args | grep -E "next start -p 3001|next-server" | grep -v grep | awk '{print $1}' | xargs -r kill -9
for _ in $(seq 1 10); do
  curl -sf -o /dev/null http://localhost:3001/ || break
  sleep 1
done
NEXT_PUBLIC_ASSET_PREFIX="$BASE_PATH" NEXT_PUBLIC_ROUTE_PREFIX="$BASE_PATH" NEXT_PUBLIC_STATIC_MODE=1 npx next build
nohup env NEXT_PUBLIC_ASSET_PREFIX="$BASE_PATH" NEXT_PUBLIC_ROUTE_PREFIX="$BASE_PATH" NEXT_PUBLIC_STATIC_MODE=1 PORT=3001 npx next start -p 3001 > /tmp/hawa-static.log 2>&1 &
for _ in $(seq 1 30); do
  curl -sf -o /dev/null http://localhost:3001/ && break
  sleep 2
done
curl -s -o /dev/null -w "static home: %{http_code}\n" http://localhost:3001/
