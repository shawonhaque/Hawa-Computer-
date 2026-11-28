#!/usr/bin/env bash
# Mirrors the running static build into /tmp/ghp-site and force-pushes it to gh-pages.
# Usage: BASE_PATH=/Hawa-Computer- ./scripts/build-static.sh && ./scripts/publish-static.sh
set -euo pipefail

REPO="shawonhaque/Hawa-Computer-"
SITE=/tmp/ghp-site
CLONE=/tmp/ghp-repo

python3 "$(dirname "$0")/mirror.py"

rm -rf "$CLONE"
git clone --depth 1 -b gh-pages "https://x-access-token:${GITHUB_TOKEN}@github.com/${REPO}.git" "$CLONE" -q
find "$CLONE" -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
cp -a "$SITE"/. "$CLONE"/

cd "$CLONE"
git add -A
git -c user.name="openhands" -c user.email="openhands@all-hands.dev" \
  commit -q -m "Deploy static site (client-side auth, orders, checkout, tracking)"
git push -q --force origin gh-pages
echo PUSHED
