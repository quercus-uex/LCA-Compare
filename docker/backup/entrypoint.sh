#!/bin/sh
set -eu

# Ejecución manual puntual: docker compose run --rm db-backup backup
if [ "${1:-}" = "backup" ]; then
  exec backup
fi

echo "${BACKUP_SCHEDULE:-0 3 * * *} backup >> /proc/1/fd/1 2>&1" > /etc/crontabs/root
exec crond -f -l 2
