#!/usr/bin/env bash
# Starts, seeds and removes a temporary LCA Compare demo instance.
#
#   ./demo.sh up     Starts the demo and, if the database is empty, seeds it
#   ./demo.sh down   Stops the demo and deletes its data and the generated .env
#
# Only asks for what is strictly needed (from the environment or interactively):
#   DEMO_ADMIN_EMAIL  Administrator email
#   DEMO_PASSWORD     Password for the administrator and the sample users
# Optional: DEMO_PORT (8080), TAG (1.3.0), OPENROUTER_API_KEY (AI text in reports).
# Internal secrets (database, JWT, CALC_API_KEY) are generated into .env.
set -euo pipefail

cd "$(dirname "$0")"

compose() {
  docker compose "$@"
}

random_secret() {
  head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n'
}

ensure_env() {
  if [[ ! -f .env ]]; then
    umask 077
    cat > .env <<EOF
DB_PASSWORD=$(random_secret)
JWT_SECRET=$(random_secret)
CALC_API_KEY=$(random_secret)
EOF
    echo "Generated .env with random secrets."
  fi
}

ask() {
  local var="$1" prompt="$2" secret="${3:-}"
  if [[ -n "${!var:-}" ]]; then
    return
  fi
  if [[ ! -t 0 ]]; then
    echo "Error: $var is not set and there is no terminal to ask for it." >&2
    exit 1
  fi
  if [[ -n "$secret" ]]; then
    read -rsp "$prompt: " "${var?}"
    echo
  else
    read -rp "$prompt: " "${var?}"
  fi
  export "${var?}"
}

is_empty() {
  local count
  count=$(compose exec -T db sh -c 'psql -U "$POSTGRES_USER" -d acv -tAc "select count(*) from \"Usuario\""')
  [[ "$count" == "0" ]]
}

up() {
  ensure_env
  compose pull --ignore-pull-failures
  compose up -d

  echo "Waiting for migrations..."
  compose wait migrate >/dev/null

  if is_empty; then
    ask DEMO_ADMIN_EMAIL "Administrator email"
    ask DEMO_PASSWORD "Demo password (min. 8 characters)" secret
    compose run --rm --no-deps -e DEMO_ADMIN_EMAIL -e DEMO_PASSWORD \
      lca-compare-backend node apps/server/dist/src/scripts/seed-demo.js
  else
    echo "The database already has data; skipping seeding."
  fi

  echo
  echo "Demo available at http://localhost:${DEMO_PORT:-8080}"
}

down() {
  if [[ -f .env ]]; then
    compose down -v --remove-orphans
    rm -f .env
  fi
  echo "Demo removed."
}

case "${1:-}" in
  up) up ;;
  down) down ;;
  *)
    echo "Usage: $0 {up|down}" >&2
    exit 1
    ;;
esac
