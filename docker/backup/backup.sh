#!/bin/sh
set -euo pipefail

TS=$(date +%Y%m%d-%H%M%S)
FILE="lca-${TS}.sql.gz"
S3_ENABLED="${BACKUP_S3_ENABLED:-false}"
LOCAL_ENABLED="${BACKUP_LOCAL_ENABLED:-false}"
LOCAL_DIR="${BACKUP_LOCAL_DIR:-/backups}"

if [ "$S3_ENABLED" != "true" ] && [ "$LOCAL_ENABLED" != "true" ]; then
  echo "ERROR: BACKUP_S3_ENABLED y BACKUP_LOCAL_ENABLED no pueden estar desactivadas a la vez" >&2
  exit 1
fi

S3_BASE=""
S3_ENDPOINT_OPT=""
if [ "$S3_ENABLED" = "true" ]; then
  S3_BASE="s3://${S3_BUCKET}/lca-compare-db"
  if [ -n "${S3_ENDPOINT:-}" ]; then
    S3_ENDPOINT_OPT="--endpoint-url ${S3_ENDPOINT}"
  fi
fi

export PGPASSWORD="$POSTGRES_PASSWORD"

dump() {
  pg_dump -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" | gzip
}

# Copia diaria
if [ "$LOCAL_ENABLED" = "true" ]; then
  mkdir -p "${LOCAL_DIR}/daily"
  dump > "${LOCAL_DIR}/daily/${FILE}"
  if [ "$S3_ENABLED" = "true" ]; then
    aws $S3_ENDPOINT_OPT s3 cp "${LOCAL_DIR}/daily/${FILE}" "${S3_BASE}/daily/${FILE}"
  fi
else
  dump | aws $S3_ENDPOINT_OPT s3 cp - "${S3_BASE}/daily/${FILE}"
fi

# Los domingos, copia adicional con retención larga
if [ "$(date +%u)" -eq 7 ]; then
  if [ "$S3_ENABLED" = "true" ]; then
    aws $S3_ENDPOINT_OPT s3 cp "${S3_BASE}/daily/${FILE}" "${S3_BASE}/weekly/${FILE}"
  fi
  if [ "$LOCAL_ENABLED" = "true" ]; then
    mkdir -p "${LOCAL_DIR}/weekly"
    cp "${LOCAL_DIR}/daily/${FILE}" "${LOCAL_DIR}/weekly/${FILE}"
  fi
fi

echo "Backup OK: ${FILE}"
