#!/usr/bin/env sh
# Sao lưu thủ công PostgreSQL (NFR-REL): pg_dump nén vào ./backups, giữ 30 ngày.
# Dùng: ./scripts/backup-db.sh   (cần Docker; container mặc định culinaryblog-postgres)
set -eu

CONTAINER="${POSTGRES_CONTAINER:-culinaryblog-postgres}"
DB="${POSTGRES_DB:-culinaryblog}"
USER_NAME="${POSTGRES_USER:-postgres}"
DEST="${BACKUP_DIR:-./backups}"
KEEP_DAYS="${BACKUP_KEEP_DAYS:-30}"

mkdir -p "$DEST"
FILE="$DEST/${DB}-$(date +%Y%m%d-%H%M%S).sql.gz"

docker exec "$CONTAINER" pg_dump -U "$USER_NAME" -d "$DB" --no-owner | gzip > "$FILE"
echo "Đã sao lưu: $FILE"

find "$DEST" -name "${DB}-*.sql.gz" -mtime +"$KEEP_DAYS" -print -delete
