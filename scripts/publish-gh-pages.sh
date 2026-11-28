#!/usr/bin/env bash
# Mirrors the static build into the gh-pages branch with working links for both locales.
# Usage:
#   ./scripts/publish-gh-pages.sh                                  # sub-path project site
#   BASE_PATH= CUSTOM_DOMAIN=hawacomputer.com ./scripts/publish-gh-pages.sh   # custom domain, clean URLs
set -euo pipefail

BASE_PATH="${BASE_PATH-/Hawa-Computer-}"
CUSTOM_DOMAIN="${CUSTOM_DOMAIN:-}"
REPO="${REPO:-shawonhaque/Hawa-Computer-}"
OUT="/tmp/ghp-site"

BASE_PATH="$BASE_PATH" CUSTOM_DOMAIN="$CUSTOM_DOMAIN" OUT="$OUT" python3 "$(dirname "$0")/mirror.py"

cd /tmp
rm -rf ghp-repo
git clone --depth 1 -b gh-pages "https://x-access-token:${GITHUB_TOKEN}@github.com/${REPO}.git" ghp-repo -q
find ghp-repo -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
cp -a "$OUT"/. ghp-repo/
cd ghp-repo
git add -A
git -c user.name="openhands" -c user.email="openhands@all-hands.dev" commit -q -m "Deploy static site (${CUSTOM_DOMAIN:-${BASE_PATH:-root}})" || echo "nothing to commit"
git push -q --force origin gh-pages
echo "published: ${CUSTOM_DOMAIN:-https://shawonhaque.github.io${BASE_PATH}}"
