---
sidebar_label: 'Deployment'
sidebar_position: 2
---

# Service Deployment

The whole platform (LCA Compare, LCA Bridge, the OpenLCA IPC server, and backups) is deployed with a single Docker Compose file, `deploy/compose.yaml`, from the repository ([https://github.com/quercus-uex/LCA-Compare](https://github.com/quercus-uex/LCA-Compare)). The compose file uses images already published to GitHub Container Registry (GHCR), so there is no need to clone the repository on the server.

## Prerequisites

- Docker Engine with the Compose plugin.
- The OpenLCA data (`ecoinvent` database) in a directory on the server. It is not included in the image for licensing reasons.
- If the GHCR packages are private, log in once with a *classic* token with the `read:packages` scope:

```bash
echo "$TOKEN" | docker login ghcr.io -u <user> --password-stdin
```

## Environment Variables

Prepare a directory with the compose file and its `.env` file, starting from `deploy/compose.yaml` and `deploy/.env.example`:

```bash
mkdir ~/lca-platform && cd ~/lca-platform
# copy deploy/compose.yaml as compose.yaml and deploy/.env.example as .env
chmod 600 .env
```

Then adjust the values in `.env`:

```sh
TAG=main                                 # Image tag: main, or sha-<hash> to pin a version

DB_USER=                                 # Database user
DB_PASSWORD=                             # Database password
JWT_SECRET=                              # Secret key for JWT (authentication)
OPENROUTER_API_KEY=                      # API key for OpenRouter (AI in reports)
MAILER_EMAIL=                            # Email account for notifications
MAILER_PASSWORD=                         # Password of the notification email account
CALC_API_KEY=                            # API key required by /calc in the x-api-key header
DEFAULT_IMPACT_METHOD_UUID=2f995579-06bd-4681-b07c-cee3b1805b0d  # Default impact method (EF 3.1)

OLCA_DATA_DIR=/home/ivan/openlca/data    # Directory with the OpenLCA data

BACKUP_SCHEDULE="0 3 * * *"              # Backup cron schedule
BACKUP_LOCAL_ENABLED=true                # Save backups to a local directory on the machine
BACKUP_LOCAL_DIR=./backups               # Local backup directory (mounted into the container as /backups)
BACKUP_S3_ENABLED=true                   # Upload backups to the S3 bucket
BACKUP_S3_ENDPOINT=                      # Empty for AWS S3; endpoint for S3-compatible providers
BACKUP_S3_REGION=eu-south-2              # Backup bucket region
BACKUP_S3_BUCKET=lca-compare-backup      # S3 bucket for backups
BACKUP_S3_ACCESS_KEY_ID=                 # Access key of the backup IAM user
BACKUP_S3_SECRET_ACCESS_KEY=             # Secret key of the backup IAM user
```

`DATABASE_URL` is not set: the compose file builds it as `postgres://${DB_USER}:${DB_PASSWORD}@db:5432/acv`. If a required variable is missing, `docker compose` stops and says which one.

## Deployment

With `.env` ready, pull the images and start the platform:

```bash
docker compose pull
docker compose up -d
docker compose ps
```

On startup, the `migrate` service waits for the database and runs `prisma migrate deploy`. On an empty database it creates the schema (with the PostGIS extension) and loads the initial data: countries, provinces, towns, and the EF 3.1 impact method. On later deployments it only applies pending migrations. The backend does not start until `migrate` finishes successfully; if it fails, check `docker compose logs migrate`.

## Create an Administrator User

The backend includes a script to create a user with the `admin` role. The script requires `DATABASE_URL` to be available and the backend to be built.

### Local Development

Build the backend and run the script from the repository root. The `admin:create` script only exists in the `server` package, so it must be invoked with `--filter`:

```bash
pnpm server:build
pnpm --filter server admin:create -- --email="admin@example.com" --password="secret" --nombre="Admin" --apellidos="Platform"
```

### Production with Docker

After the first startup, run it in a one-off container with the backend image:

```bash
docker compose run --rm lca-compare-backend node apps/server/dist/src/scripts/create-admin.js \
  --email="admin@example.com" --password="secret" --nombre="Admin" --apellidos="Platform"
```

The script validates the email, requires a password of at least 8 characters, and checks that no user with the same email already exists.

## Docker Compose Structure

The `deploy/compose.yaml` file defines the `lca-platform` project with the following services:

| Service | Image | Port | Role |
|---|---|---|---|
| `db` | `postgis/postgis:17-master` | — | PostgreSQL with PostGIS |
| `migrate` | `ghcr.io/quercus-uex/lca-compare-backend` | — | Applies Prisma migrations and exits |
| `lca-compare-backend` | `ghcr.io/quercus-uex/lca-compare-backend` | — | REST API (NestJS) |
| `lca-compare-frontend` | `ghcr.io/quercus-uex/lca-compare-frontend` | 80→80 | SPA and reverse proxy (Nginx) |
| `lca-bridge` | `ghcr.io/quercus-uex/lca-bridge` | — | LCA calculation |
| `openlca-ipc` | `ghcr.io/quercus-uex/openlca-ipc` | — | OpenLCA IPC server using the data in `OLCA_DATA_DIR` |
| `db-backup` | `ghcr.io/quercus-uex/lca-compare-backup` | — | Database backups |

### Networks

All services share the project network, `lca-platform_default`, and reach each other by service name. Only the frontend publishes a port (80); the database, backend, LCA Bridge, and OpenLCA are not reachable from outside. If you need to access PostgreSQL from another machine, use an SSH tunnel.

### Reverse Proxy (Nginx)

The frontend is served by Nginx, which acts as a reverse proxy with the following routing:

| Host / path | Destination |
|---|---|
| `/api/` | `lca-compare-backend:3000` (REST API, the `/api` prefix is removed) |
| `/calc` | `lca-bridge:3000/capture-acv` (LCA calculation; requires the `x-api-key` header with the value of `CALC_API_KEY`, otherwise returns 401) |
| `/` | Statically served SPA (`index.html`) |
| `quercusstatus.duckdns.org` | `uptime-kuma:3001` (Uptime Kuma) |

Nginx uses upstreams with `resolve` and Docker's internal DNS (`127.0.0.11`), with DNS cache entries valid for 10 seconds (`valid=10s`). This lets it detect IP changes when services are recreated and update its destinations without restarting Nginx. If a service is unavailable, its route returns 502 without preventing Nginx from starting. This configuration requires Nginx 1.27.3 or later.

## Uptime Kuma

Uptime Kuma runs on the same server, but outside the compose file. It joins the platform network so Nginx can reach it as `uptime-kuma`, so it must be started after the first `docker compose up -d`:

```bash
docker run -d --name uptime-kuma --restart unless-stopped \
  --network lca-platform_default -v uptime-kuma:/app/data louislam/uptime-kuma:1
```

While Uptime Kuma is attached, `docker compose down` cannot remove the `lca-platform_default` network: it prints a warning and leaves the other services stopped. `docker compose up -d` reuses the network without problems.

To update it, run `docker pull louislam/uptime-kuma:1` and `docker rm -f uptime-kuma`, then repeat the `docker run` above.

## CI/CD

The `.github/workflows/build.yml` workflow runs on every push to `main` (and manually from GitHub). It builds and publishes the `lca-compare-backend`, `lca-compare-frontend`, and `lca-compare-backup` images to GHCR, each tagged `main` and `sha-<hash>`. The LCA Bridge repository has an equivalent workflow that publishes `lca-bridge` and `openlca-ipc`.

GitHub Actions does not connect to the server: deployment is manual.

The repository also includes the `.github/workflows/sonar.yml` workflow, which installs dependencies, builds `packages/common`, generates the Prisma client, and runs backend coverage before SonarCloud analysis.

## Updating

Once the new images are published, update the server:

```bash
# from your local machine, only if deploy/compose.yaml has changed
scp deploy/compose.yaml <user>@<server>:~/lca-platform/compose.yaml

# on the server
cd ~/lca-platform
docker compose pull
docker compose up -d --remove-orphans
docker image prune -f
```

To update only LCA Bridge:

```bash
docker compose pull lca-bridge openlca-ipc
docker compose up -d lca-bridge openlca-ipc
```

To roll back to a previous version, set `TAG=sha-<hash>` in `.env` and run `docker compose up -d`. Database migrations that were already applied are not undone.

## Backups

The `db-backup` service performs automatic database backups. According to `BACKUP_SCHEDULE` (by default, every day at 03:00 UTC) it runs `pg_dump` against the `acv` database and gzips the output. The destination of the backups is controlled by two boolean variables, and at least one must be enabled (otherwise the `backup` command fails). If they are not set in `.env`, the compose file disables S3 and enables the local backup:

- **`BACKUP_S3_ENABLED`**: uploads the backup to `s3://<bucket>/lca-compare-db/daily/`. On Sundays it also copies the backup to the `lca-compare-db/weekly/` prefix for longer retention.
- **`BACKUP_LOCAL_ENABLED`**: saves the backup to a local directory on the machine. The directory is set with `BACKUP_LOCAL_DIR` (default `./backups`, relative to `compose.yaml`) and is mounted into the container as `/backups`. Backups are organized the same way as in S3: `daily/` and, on Sundays, `weekly/`.

If both destinations are enabled, the dump is generated once and written to both. With only S3 enabled, the backup is streamed without using disk space on the server.

Retention of the S3 backups is enforced by the bucket lifecycle rules (7 daily and 4 weekly). Local backups are **not rotated automatically**: `BACKUP_LOCAL_DIR` must be purged by other means (cron, logrotate...).

The image is built from `docker/backup/` (PostgreSQL 17 client + AWS CLI + cron) and exposes the `backup` command — the same one cron runs — which you can also trigger manually.

### AWS prerequisites

This setup is only needed if `BACKUP_S3_ENABLED=true`. Before the first deployment with S3 backups, three things must be prepared in the AWS account:

**1. Create the S3 bucket.** The name must be globally unique (e.g. `lca-compare-backup`). Keep public access blocked (the default), leave versioning disabled, and pick the region you will set in `BACKUP_S3_REGION` (e.g. `eu-south-2`).

**2. Create an IAM user with minimal permissions.** Create a policy with this JSON (adjusting the bucket name):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ListBucket",
      "Effect": "Allow",
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::lca-compare-backup"
    },
    {
      "Sid": "ReadWriteObjects",
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::lca-compare-backup/*"
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
  --bucket lca-compare-backup \
  --lifecycle-configuration file://lifecycle.json
```

The margins (8 and 29 days) guarantee keeping at least 7 and 4 complete copies, because AWS evaluates the rules only once a day.

### Manual run and verification

The `backup` command lets you trigger a backup on demand and check that everything works:

```bash
# With the container running
docker compose exec db-backup backup

# Or as a one-off run
docker compose run --rm db-backup backup
```

If everything goes well you will see `Backup OK: lca-<date>.sql.gz`. Check that the backup is in its destination:

```bash
# S3
aws s3 ls s3://lca-compare-backup/lca-compare-db/daily/

# Local directory (the path configured in BACKUP_LOCAL_DIR)
ls ./backups/daily/
```

Scheduled runs are recorded in the container logs (`docker compose logs db-backup`).

### Restore

```bash
# 1. Download the backup (only if the backup is in S3; if it is in the local directory, skip this step and use that path)
aws s3 cp s3://lca-compare-backup/lca-compare-db/daily/<file>.sql.gz .

# 2. Stop the services that use the database
docker compose stop lca-compare-backend db-backup

# 3. Recreate the database with the PostGIS extension
docker compose exec -T db sh -c 'psql -U "$POSTGRES_USER" -d postgres -c "DROP DATABASE acv" -c "CREATE DATABASE acv"'
docker compose exec -T db sh -c 'psql -U "$POSTGRES_USER" -d acv -c "CREATE EXTENSION IF NOT EXISTS postgis"'

# 4. Restore and start the services again
gunzip -c <file>.sql.gz | docker compose exec -T db sh -c 'psql -U "$POSTGRES_USER" -d acv'
docker compose up -d
```

The backup includes the Prisma migrations table, so when the services start again `migrate` only applies the migrations created after the backup.

## Verification

After deployment, verify that the services respond correctly:

```bash
# Frontend
curl http://localhost/

# REST API (Swagger documentation)
curl http://localhost/api/docs/

# LCA calculation without an API key (must return 401)
curl -i -X POST http://localhost/calc
```
