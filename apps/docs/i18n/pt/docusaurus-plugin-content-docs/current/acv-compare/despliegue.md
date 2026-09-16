---
sidebar_label: 'Implantação'
sidebar_position: 2
---

# Implantação do Serviço

Antes de implantar o serviço de comparação de ACV, é necessário ter clonado o repositório ([https://github.com/quercus-uex/LCA-Compare](https://github.com/quercus-uex/LCA-Compare)).

## Variáveis de Ambiente

O serviço lê a sua configuração a partir de um ficheiro `.env` localizado na raiz do projeto. Como ponto de partida, copie o ficheiro `.env.example` incluído no repositório e renomeie-o para `.env`:

```bash
cp .env.example .env
```

Em seguida, ajuste os valores ao seu ambiente:

```sh
DATABASE_URL="postgres://user:password@localhost:5432/acv"  # Ligação local usada fora de Docker
JWT_SECRET="CHANGEME"                    # Chave secreta para JWT (autenticação)
OPENROUTER_API_KEY="sk-or-v1-...."       # Chave de API para OpenRouter (IA em relatórios)

DB_USER="user"                           # Utilizador da base de dados
DB_PASSWORD="password"                   # Palavra-passe da base de dados

MAILER_EMAIL="example@example.com"       # Email para envio de notificações
MAILER_PASSWORD="Password"               # Palavra-passe do email para notificações

CAPTURE_ACV_EMAIL="email@example.com"    # Email para autenticação no LCA Capture (extração massiva)
CAPTURE_ACV_PASSWORD="P@ssw0rd"          # Palavra-passe para autenticação no LCA Capture (extração massiva)

DEFAULT_IMPACT_METHOD_UUID="2f995579-06bd-4681-b07c-cee3b1805b0d"  # UUID do método de impacto por defeito (EF 3.1)

PORT=8000                                # Porta do backend em desenvolvimento

CALC_API_KEY="calc-api-key"              # Chave de API para realizar um cálculo de ACV

LCA_CAPTURE_CLIENT_ID="..."              # Credenciais do LCA Capture (apenas para regenerar os PDFs da documentação)
LCA_CAPTURE_CLIENT_SECRET="..."

BACKUP_S3_ENABLED="false"                 # Enviar as cópias para o bucket S3
BACKUP_LOCAL_ENABLED="false"              # Guardar as cópias num diretório local da máquina
BACKUP_LOCAL_DIR="./backups"              # Diretório local para as cópias (montado no contentor como /backups)
BACKUP_S3_ENDPOINT=""                    # Vazio para AWS S3; endpoint para fornecedores compatíveis com S3
BACKUP_S3_REGION="eu-west-1"             # Região do bucket de backups
BACKUP_S3_BUCKET="acv-db-backups"        # Bucket S3 para as cópias de segurança
BACKUP_S3_ACCESS_KEY_ID="..."            # Access key do utilizador IAM de backups
BACKUP_S3_SECRET_ACCESS_KEY="..."        # Secret key do utilizador IAM de backups
```

Em produção com Docker Compose, `DATABASE_URL` é injetada automaticamente no backend como `postgres://${DB_USER}:${DB_PASSWORD}@db:5432/acv`. O valor do `.env` fica disponível para comandos locais, testes ou desenvolvimento fora do contentor.

## Inicialização da Base de Dados

Em primeiro lugar, é necessário implantar a base de dados. Para isso, levantamos o serviço de base de dados do Docker Compose:

```bash
docker compose up -d db
```

Após implantar a base de dados, sincronize o esquema do Prisma a partir do pacote `server`. O esquema está dividido em `apps/server/prisma/schema/` e a configuração do Prisma está em `apps/server/prisma.config.ts`, pelo que os comandos devem ser executados através dos scripts do workspace ou passando explicitamente essa configuração. A implantação utiliza `prisma db push`, que aplica o esquema diretamente sem histórico de migrações:

```bash
pnpm --filter server prisma:db:push
```

Por fim, execute o ficheiro SQL com os dados iniciais (países, províncias, localidades...) disponível em `init/dbinit.sql`. Este ficheiro é um seed SQL manual de dados de referência de Portugal, não uma migração automática:

```bash
docker exec -i db psql -U ${DB_USER} -d acv < init/dbinit.sql
```

## Criar um Utilizador Administrador

O backend inclui um script para criar um utilizador com o papel `admin`. O script necessita que `DATABASE_URL` esteja disponível e que o backend esteja compilado.

### Em Desenvolvimento Local

Compile o backend e execute o script a partir da raiz do repositório. O script `admin:create` só existe no pacote `server`, pelo que deve ser invocado com `--filter`:

```bash
pnpm server:build
pnpm --filter server admin:create -- --email="admin@example.com" --password="secreto" --nombre="Admin" --apellidos="Plataforma"
```

### Em Produção com Docker

Depois de levantado o contentor do backend, execute-o dentro de `lca-compare-backend`:

```bash
docker compose exec lca-compare-backend pnpm --filter server admin:create -- --email="admin@example.com" --password="secreto" --nombre="Admin" --apellidos="Plataforma"
```

O script valida o email, exige uma palavra-passe de pelo menos 8 caracteres e verifica se já existe um utilizador com o mesmo correio.

## Estrutura do Docker Compose

O ficheiro `docker-compose.yaml` define quatro serviços. A base de dados é iniciada sem perfil e as aplicações são incluídas apenas com o perfil `prod`:

| Serviço | Imagem | Porta | Perfil |
|---|---|---|---|
| `db` | `postgis/postgis:17-master` | 5432 | *(sempre ativo)* |
| `lca-compare-backend` | Construída a partir de `apps/server/Dockerfile` | 8080→3000 | `prod` |
| `lca-compare-frontend` | Construída a partir de `apps/web/Dockerfile` | 80→80 | `prod` |
| `db-backup` | Construída a partir de `docker/backup/Dockerfile` | — | `prod` |

### Redes

O compose define duas redes:

- **`lca-compare`**: rede interna para comunicação entre o backend, frontend, base de dados e backups.
- **`olca`**: rede externa partilhada com o serviço LCA Bridge. Deve ser criada manualmente:

```bash
docker network create olca
```

### Proxy Inverso (Nginx)

O frontend é servido com Nginx, que atua como proxy inverso com o seguinte encaminhamento:

| Rota | Destino |
|---|---|
| `/api/` | `lca-compare-backend:3000` (API REST, removendo o prefixo `/api`) |
| `/calc` | `lca-bridge:3000/capture-acv` (cálculo de ACV) |
| `/` | SPA servida estaticamente (`index.html`) |

## Implantação Completa

Depois de preparar a base de dados, implantamos todos os serviços com o perfil de produção:

```bash
docker compose --profile prod up -d --build
```

Isto constrói as imagens do backend, frontend e backup e levanta os quatro serviços. A imagem do backend compila primeiro `packages/common`, gera o cliente Prisma e depois compila NestJS. Se não sincronizou o esquema durante a preparação anterior da base de dados, faça-o agora no contentor do backend usando o script do workspace `server`:

```bash
docker compose exec lca-compare-backend pnpm --filter server prisma:db:push
```

## CI/CD

O projeto inclui um workflow de GitHub Actions (`.github/workflows/deploy.yml`) executado em cada push para as branches `main` e `develop`. O pipeline:

1. Liga-se por SSH ao servidor de implantação.
2. Clona ou atualiza o repositório na branch correspondente.
3. Reconstrói e levanta os contentores com `docker compose --profile prod up -d --build`.
4. Sincroniza o esquema do Prisma com `pnpm --filter server prisma:db:push` dentro do contentor `lca-compare-backend`.

As variáveis de ambiente sensíveis são injetadas a partir dos secrets do GitHub (`DB_USER`, `DB_PASSWORD`, `JWT_SECRET`, `OPENROUTER_API_KEY`, `CAPTURE_ACV_EMAIL`, `CAPTURE_ACV_PASSWORD`, `MAILER_EMAIL`, `MAILER_PASSWORD`, `DEFAULT_IMPACT_METHOD_UUID`, `CALC_API_KEY`, `BACKUP_S3_ENDPOINT`, `BACKUP_S3_REGION`, `BACKUP_S3_BUCKET`, `BACKUP_S3_ACCESS_KEY_ID` e `BACKUP_S3_SECRET_ACCESS_KEY`).

O repositório também inclui o workflow `.github/workflows/sonar.yml`, que instala dependências, compila `packages/common`, gera o cliente Prisma e executa a cobertura do backend antes da análise do SonarCloud.

## Cópias de segurança

O serviço `db-backup` (perfil `prod`) realiza cópias de segurança automáticas da base de dados. Todos os dias às 03:00 UTC executa `pg_dump` sobre a base `acv` e comprime o resultado com gzip. O destino das cópias controla-se com duas variáveis booleanas. Ambas estão desativadas por predefinição e é necessário ativar pelo menos uma explicitamente (caso contrário, o comando `backup` termina com erro):

- **`BACKUP_S3_ENABLED`**: carrega a cópia para `s3://<bucket>/lca-compare-db/daily/`. Aos domingos copia ainda o backup para o prefixo `lca-compare-db/weekly/` para uma retenção mais longa.
- **`BACKUP_LOCAL_ENABLED`**: guarda a cópia num diretório local da máquina. O diretório define-se com `BACKUP_LOCAL_DIR` (predefinição `./backups`, relativo ao `docker-compose.yaml`) e é montado no contentor como `/backups`. As cópias organizam-se da mesma forma que no S3: `daily/` e, aos domingos, `weekly/`.

Se ambos os destinos estiverem ativos, o dump é gerado uma única vez e escrito nos dois. Com apenas o S3 ativo, a cópia é carregada em streaming, sem ocupar disco no servidor.

O workflow de implantação (`.github/workflows/deploy.yml`) força ambas as variáveis a `true`, pelo que no servidor são geradas as duas cópias: em S3 e em `./backups` dentro do diretório de implantação.

A retenção das cópias no S3 é aplicada pelas lifecycle rules do bucket (7 diárias e 4 semanais). As cópias locais **não são rodadas automaticamente**: é necessário purgar `BACKUP_LOCAL_DIR` por outros meios (cron, logrotate...).

A imagem é construída a partir de `docker/backup/` (cliente PostgreSQL 17 + AWS CLI + cron) e expõe o comando `backup`, o mesmo que o cron executa, e que também pode ser lançado manualmente.

### Configuração prévia na AWS

Esta configuração só é necessária se `BACKUP_S3_ENABLED=true`. Antes da primeira implantação com backups em S3, é necessário preparar três coisas na conta AWS:

**1. Criar o bucket S3.** O nome deve ser globalmente único (p. ex. `acv-db-backups`). Mantenha o bloqueio de acesso público ativado (é a predefinição), deixe o versionamento desativado e escolha a região que usará em `BACKUP_S3_REGION` (p. ex. `eu-west-1`).

**2. Criar um utilizador IAM com permissões mínimas.** Crie uma política com este JSON (ajustando o nome do bucket):

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

Atribua a política a um novo utilizador (p. ex. `acv-db-backup`) e gere uma access key com o caso de uso "Application running outside AWS". Esses dois valores são `BACKUP_S3_ACCESS_KEY_ID` e `BACKUP_S3_SECRET_ACCESS_KEY`.

**3. Configurar as regras de ciclo de vida (retenção).** A rotação não é feita pelo contentor: é aplicada pelas lifecycle rules do bucket, conservando 7 cópias diárias e 4 semanais:

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

Configuram-se uma única vez, na consola (S3 → bucket → Management → Lifecycle rules) ou por CLI com credenciais de administrador (não as do utilizador de backups):

```bash
aws s3api put-bucket-lifecycle-configuration \
  --bucket acv-db-backups \
  --lifecycle-configuration file://lifecycle.json
```

As margens (8 e 29 dias) garantem a conservação de pelo menos 7 e 4 cópias completas, porque a AWS avalia as regras apenas uma vez por dia.

### Execução manual e verificação

O comando `backup` permite lançar uma cópia sob demanda e verificar que tudo funciona:

```bash
# Com o contentor em execução
docker compose --profile prod exec db-backup backup

# Ou como execução pontual
docker compose --profile prod run --rm db-backup backup
```

Se tudo correr bem verá `Backup OK: lca-<data>.sql.gz`. Verifique que a cópia está no seu destino:

```bash
# S3
aws s3 ls s3://acv-db-backups/lca-compare-db/daily/

# Diretório local (o caminho configurado em BACKUP_LOCAL_DIR)
ls ./backups/daily/
```

As execuções programadas ficam registadas nos logs do contentor (`docker logs`).

### Restauro

```bash
# 1. Descarregar o backup (apenas se a cópia estiver no S3; se estiver no diretório local, salte este passo e use esse caminho)
aws s3 cp s3://acv-db-backups/lca-compare-db/daily/<ficheiro>.sql.gz .

# 2. Recriar a base de dados com a extensão PostGIS (com o backend parado)
docker compose exec -T db psql -U "$DB_USER" -d postgres -c "DROP DATABASE acv; CREATE DATABASE acv;"
docker compose exec -T db psql -U "$DB_USER" -d acv -c "CREATE EXTENSION IF NOT EXISTS postgis;"

# 3. Restaurar
gunzip -c <ficheiro>.sql.gz | docker compose exec -T db psql -U "$DB_USER" -d acv
```

## Verificação

Depois de implantado, verifique se os serviços respondem corretamente:

```bash
# Frontend
curl http://localhost/

# API REST (documentação Swagger)
curl http://localhost/api/docs/
```
