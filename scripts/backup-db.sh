#!/usr/bin/env bash
# Dumps the compose-managed Postgres database and keeps the newest BACKUP_KEEP dumps.
# Cron: 30 2 * * * /srv/hawa/scripts/backup-db.sh >> /var/log/hawa-backup.log 2>&1
set -euo pipefail

DIR="${BACKUP_DIR:-$(cd "$(dirname "$0")/.." && pwd)/backups}"
KEEP="${BACKUP_KEEP:-14}"
USER="${POSTGRES_USER:-hawa}"
DB="${POSTGRES_DB:-hawa_computer}"

mkdir -p "$DIR"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
FILE="$DIR/hawa-$STAMP.sql.gz"

docker compose exec -T db pg_dump -U "$USER" -d "$DB" --no-owner --clean --if-exists | gzip -9 > "$FILE"
test -s "$FILE" || { echo "dump is empty: $FILE" >&2; rm -f "$FILE"; exit 1; }

find "$DIR" -maxdepth 1 -name 'hawa-*.sql.gz' -type f | sort -r | tail -n "+$((KEEP + 1))" | xargs -r rm --
echo "backup ok: $FILE ($(du -h "$FILE" | cut -f1))"
