---
sidebar_label: 'Deployment'
sidebar_position: 2
---

# Service Deployment

Before deploying the LCA comparison service, you need to have cloned the repository ([https://github.com/quercus-uex/LCA-Compare](https://github.com/quercus-uex/LCA-Compare)).

## Environment Variables

The service reads its configuration from a `.env` file located at the project root. As a starting point, copy the `.env.example` file included in the repository and rename it to `.env`:

```bash
cp .env.example .env
```

Then adjust the values for your environment:

```sh
DATABASE_URL="postgres://user:password@localhost:5432/acv"  # Local connection used outside Docker
JWT_SECRET="CHANGEME"                    # Secret key for JWT (authentication)
OPENROUTER_API_KEY="sk-or-v1-...."       # API key for OpenRouter (AI in reports)

DB_USER="user"                           # Database user
DB_PASSWORD="password"                   # Database password

MAILER_EMAIL="example@example.com"       # Email for notification delivery
MAILER_PASSWORD="Password"               # Email password for notifications

CAPTURE_ACV_EMAIL="email@example.com"    # Email for LCA Capture authentication (bulk extraction)
CAPTURE_ACV_PASSWORD="P@ssw0rd"          # Password for LCA Capture authentication (bulk extraction)

DEFAULT_IMPACT_METHOD_UUID="2f995579-06bd-4681-b07c-cee3b1805b0d"  # UUID of the default impact method (EF 3.1)

PORT=8000                                # Backend port in development

CALC_API_KEY="calc-api-key"              # API key to perform an LCA calculation

LCA_CAPTURE_CLIENT_ID="..."              # LCA Capture credentials (only used to regenerate the documentation PDFs)
LCA_CAPTURE_CLIENT_SECRET="..."

BACKUP_S3_ENABLED="false"                 # Upload backups to the S3 bucket
BACKUP_LOCAL_ENABLED="false"              # Save backups to a local directory on the machine
BACKUP_LOCAL_DIR="./backups"              # Local directory for backups (mounted in the container as /backups)
BACKUP_S3_ENDPOINT=""                    # Empty for AWS S3; endpoint for S3-compatible providers
BACKUP_S3_REGION="eu-west-1"             # Backup bucket region
BACKUP_S3_BUCKET="acv-db-backups"        # S3 bucket for backups
BACKUP_S3_ACCESS_KEY_ID="..."            # Access key of the backup IAM user
BACKUP_S3_SECRET_ACCESS_KEY="..."        # Secret key of the backup IAM user
```

In production with Docker Compose, `DATABASE_URL` is automatically injected into the backend as `postgres://${DB_USER}:${DB_PASSWORD}@db:5432/acv`. The `.env` value remains available for local commands, tests, or development outside the container.

## Database Initialization

First, deploy the database service from Docker Compose:

```bash
docker compose up -d db
```

After deploying the database, synchronize the Prisma schema from the `server` package. The schema is split under `apps/server/prisma/schema/`, and the Prisma configuration is in `apps/server/prisma.config.ts`, so commands must run through workspace scripts or explicitly pass that configuration. Deployment uses `prisma db push`, which applies the schema directly without migration history:

```bash
pnpm --filter server prisma:db:push
```

Finally, run the SQL file with initial data (countries, provinces, towns, and so on) available at `init/dbinit.sql`. This file is a manual SQL seed for Portugal reference data, not an automatic migration:

```bash
docker exec -i db psql -U ${DB_USER} -d acv < init/dbinit.sql
```

## Create an Administrator User

The backend includes a script to create a user with the `admin` role. The script requires `DATABASE_URL` to be available and the backend to be built.

### Local Development

Build the backend and run the script from the repository root. The `admin:create` script only exists in the `server` package, so it must be invoked with `--filter`:

```bash
pnpm server:build
pnpm --filter server admin:create -- --email="admin@example.com" --password="secret" --nombre="Admin" --apellidos="Platform"
```

### Production with Docker

Once the backend container is running, execute it inside `lca-compare-backend`:

```bash
docker compose exec lca-compare-backend pnpm --filter server admin:create -- --email="admin@example.com" --password="secret" --nombre="Admin" --apellidos="Platform"
```

The script validates the email, requires a password of at least 8 characters, and checks that no user with the same email already exists.

## Docker Compose Structure

The `docker-compose.yaml` file defines four services. The database starts without a profile, and the applications are included only with the `prod` profile:

| Service | Image | Port | Profile |
|---|---|---|---|
| `db` | `postgis/postgis:17-master` | 5432 | *(always active)* |
| `lca-compare-backend` | Built from `apps/server/Dockerfile` | 8080→3000 | `prod` |
| `lca-compare-frontend` | Built from `apps/web/Dockerfile` | 80→80 | `prod` |
| `db-backup` | Built from `docker/backup/Dockerfile` | — | `prod` |

### Networks

The compose file defines two networks:

- **`lca-compare`**: internal network for communication between backend, frontend, database, and backups.
- **`olca`**: external network shared with the LCA Bridge service. It must be created manually:

```bash
docker network create olca
```

### Reverse Proxy (Nginx)

The frontend is served with Nginx, which acts as a reverse proxy with the following routing:

| Route | Destination |
|---|---|
| `/api/` | `lca-compare-backend:3000` (REST API, removing the `/api` prefix) |
| `/calc` | `lca-bridge:3000/capture-acv` (LCA calculation) |
| `/` | Statically served SPA (`index.html`) |

## Full Deployment

Once the database is ready, deploy all services with the production profile:

```bash
docker compose --profile prod up -d --build
```

This builds the backend, frontend and backup images and starts all four services. The backend image first builds `packages/common`, generates the Prisma client, and then builds NestJS. If you did not synchronize the schema during the previous database preparation step, do it now in the backend container using the workspace `server` script:

```bash
docker compose exec lca-compare-backend pnpm --filter server prisma:db:push
```

## CI/CD

The project includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that runs on every push to the `main` and `develop` branches. The pipeline:

1. Connects to the deployment server through SSH.
2. Clones or updates the repository on the corresponding branch.
3. Rebuilds and starts the containers with `docker compose --profile prod up -d --build`.
4. Synchronizes the Prisma schema with `pnpm --filter server prisma:db:push` inside the `lca-compare-backend` container.

Sensitive environment variables are injected from GitHub secrets (`DB_USER`, `DB_PASSWORD`, `JWT_SECRET`, `OPENROUTER_API_KEY`, `CAPTURE_ACV_EMAIL`, `CAPTURE_ACV_PASSWORD`, `MAILER_EMAIL`, `MAILER_PASSWORD`, `DEFAULT_IMPACT_METHOD_UUID`, `CALC_API_KEY`, `BACKUP_S3_ENDPOINT`, `BACKUP_S3_REGION`, `BACKUP_S3_BUCKET`, `BACKUP_S3_ACCESS_KEY_ID`, and `BACKUP_S3_SECRET_ACCESS_KEY`).

The repository also includes the `.github/workflows/sonar.yml` workflow, which installs dependencies, builds `packages/common`, generates the Prisma client, and runs backend coverage before SonarCloud analysis.

## Backups

The `db-backup` service (prod profile) performs automatic database backups. Every day at 03:00 UTC it runs `pg_dump` against the `acv` database and gzips the output. The destination of the backups is controlled by two boolean variables. Both are disabled by default and at least one must be enabled explicitly (otherwise the `backup` command fails):

- **`BACKUP_S3_ENABLED`**: uploads the backup to `s3://<bucket>/lca-compare-db/daily/`. On Sundays it also copies the backup to the `lca-compare-db/weekly/` prefix for longer retention.
- **`BACKUP_LOCAL_ENABLED`**: saves the backup to a local directory on the machine. The directory is set with `BACKUP_LOCAL_DIR` (default `./backups`, relative to `docker-compose.yaml`) and is mounted into the container as `/backups`. Backups are organized the same way as in S3: `daily/` and, on Sundays, `weekly/`.

If both destinations are enabled, the dump is generated once and written to both. With only S3 enabled, the backup is streamed without using disk space on the server.

The deployment workflow (`.github/workflows/deploy.yml`) forces both variables to `true`, so on the server both backups are generated: in S3 and in `./backups` inside the deployment directory.

Retention of the S3 backups is enforced by the bucket lifecycle rules (7 daily and 4 weekly). Local backups are **not rotated automatically**: `BACKUP_LOCAL_DIR` must be purged by other means (cron, logrotate...).

The image is built from `docker/backup/` (PostgreSQL 17 client + AWS CLI + cron) and exposes the `backup` command — the same one cron runs — which you can also trigger manually.

### AWS prerequisites

This setup is only needed if `BACKUP_S3_ENABLED=true`. Before the first deployment with S3 backups, three things must be prepared in the AWS account:

**1. Create the S3 bucket.** The name must be globally unique (e.g. `acv-db-backups`). Keep public access blocked (the default), leave versioning disabled, and pick the region you will set in `BACKUP_S3_REGION` (e.g. `eu-west-1`).

**2. Create an IAM user with minimal permissions.** Create a policy with this JSON (adjusting the bucket name):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ListBucket",
      "Effect": "Allow",
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::acv-db-backups"
    },
    {
      "Sid": "ReadWriteObjects",
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::acv-db-backups/*"
    }
  ]
}
```

Attach the policy to a new user (e.g. `acv-db-backup`) and generate an access key with the "Application running outside AWS" use case. Those two values are `BACKUP_S3_ACCESS_KEY_ID` and `BACKUP_S3_SECRET_ACCESS_KEY`.

**3. Configure the lifecycle rules (retention).** Rotation is not done by the container: it is enforced by the bucket lifecycle rules, keeping 7 daily and 4 weekly backups:

```json
{
  "Rules": [
    {
      "ID": "expire-daily",
      "Status": "Enabled",
      "Filter": { "Prefix": "lca-compare-db/daily/" },
      "Expiration": { "Days": 8 }
    },
    {
      "ID": "expire-weekly",
      "Status": "Enabled",
      "Filter": { "Prefix": "lca-compare-db/weekly/" },
      "Expiration": { "Days": 29 }
    }
  ]
}
```

They are configured once, from the console (S3 → bucket → Management → Lifecycle rules) or via CLI with administrator credentials (not the backup user's):

```bash
aws s3api put-bucket-lifecycle-configuration \
  --bucket acv-db-backups \
  --lifecycle-configuration file://lifecycle.json
```

The margins (8 and 29 days) guarantee keeping at least 7 and 4 complete copies, because AWS evaluates the rules only once a day.

### Manual run and verification

The `backup` command lets you trigger a backup on demand and check that everything works:

```bash
# With the container running
docker compose --profile prod exec db-backup backup

# Or as a one-off run
docker compose --profile prod run --rm db-backup backup
```

If everything goes well you will see `Backup OK: lca-<date>.sql.gz`. Check that the backup is in its destination:

```bash
# S3
aws s3 ls s3://acv-db-backups/lca-compare-db/daily/

# Local directory (the path configured in BACKUP_LOCAL_DIR)
ls ./backups/daily/
```

Scheduled runs are recorded in the container logs (`docker logs`).

### Restore

```bash
# 1. Download the backup (only if the backup is in S3; if it is in the local directory, skip this step and use that path)
aws s3 cp s3://acv-db-backups/lca-compare-db/daily/<file>.sql.gz .

# 2. Recreate the database with the PostGIS extension (with the backend stopped)
docker compose exec -T db psql -U "$DB_USER" -d postgres -c "DROP DATABASE acv; CREATE DATABASE acv;"
docker compose exec -T db psql -U "$DB_USER" -d acv -c "CREATE EXTENSION IF NOT EXISTS postgis;"

# 3. Restore
gunzip -c <file>.sql.gz | docker compose exec -T db psql -U "$DB_USER" -d acv
```

## Verification

After deployment, verify that the services respond correctly:

```bash
# Frontend
curl http://localhost/

# REST API (Swagger documentation)
curl http://localhost/api/docs/
```
