#!/bin/sh
set -euo pipefail

TS=$(date +%Y%m%d-%H%M%S)
FILE="acv-${TS}.sql.gz"
BASE="s3://${S3_BUCKET}/lca-compare-db"
ENDPOINT=""
[ -n "${S3_ENDPOINT:-}" ] && ENDPOINT="--endpoint-url ${S3_ENDPOINT}"

export PGPASSWORD="$POSTGRES_PASSWORD"

pg_dump -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  | gzip | aws $ENDPOINT s3 cp - "${BASE}/daily/${FILE}"

# Los domingos, copia adicional con retención larga
if [ "$(date +%u)" -eq 7 ]; then
  aws $ENDPOINT s3 cp "${BASE}/daily/${FILE}" "${BASE}/weekly/${FILE}"
fi

echo "Backup OK: ${FILE}"
