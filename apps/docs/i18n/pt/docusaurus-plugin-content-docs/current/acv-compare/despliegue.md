---
sidebar_label: 'Implantação'
sidebar_position: 2
---

# Implantação do Serviço

A plataforma completa (LCA Compare, LCA Bridge, servidor IPC do OpenLCA e cópias de segurança) é implantada com um único ficheiro de Docker Compose, `deploy/compose.yaml`, do repositório ([https://github.com/quercus-uex/LCA-Compare](https://github.com/quercus-uex/LCA-Compare)). O compose usa imagens já publicadas no GitHub Container Registry (GHCR), pelo que não é necessário clonar o repositório no servidor.

## Requisitos prévios

- Docker Engine com o plugin Compose.
- Os dados do OpenLCA (base de dados `ecoinvent`) num diretório do servidor. Não estão incluídos na imagem por motivos de licença.
- Se os pacotes do GHCR forem privados, iniciar sessão uma única vez com um token *classic* com a permissão `read:packages`:

```bash
echo "$TOKEN" | docker login ghcr.io -u <utilizador> --password-stdin
```

## Variáveis de Ambiente

Prepare um diretório com o compose e o respetivo ficheiro `.env`, a partir de `deploy/compose.yaml` e `deploy/.env.example`:

```bash
mkdir ~/lca-platform && cd ~/lca-platform
# copiar deploy/compose.yaml como compose.yaml e deploy/.env.example como .env
chmod 600 .env
```

Em seguida, ajuste os valores do `.env`:

```sh
TAG=main                                 # Etiqueta das imagens: main ou sha-<hash> para fixar uma versão

DB_USER=                                 # Utilizador da base de dados
DB_PASSWORD=                             # Palavra-passe da base de dados
JWT_SECRET=                              # Chave secreta para JWT (autenticação)
OPENROUTER_API_KEY=                      # Chave de API do OpenRouter (IA nos relatórios)
MAILER_EMAIL=                            # Email para envio de notificações
MAILER_PASSWORD=                         # Palavra-passe do email de notificações
CALC_API_KEY=                            # Chave de API exigida por /calc no cabeçalho x-api-key
DEFAULT_IMPACT_METHOD_UUID=2f995579-06bd-4681-b07c-cee3b1805b0d  # Método de impacto predefinido (EF 3.1)

OLCA_DATA_DIR=/home/ivan/openlca/data    # Diretório com os dados do OpenLCA

BACKUP_SCHEDULE="0 3 * * *"              # Cron das cópias de segurança
BACKUP_LOCAL_ENABLED=true                # Guardar as cópias num diretório local da máquina
BACKUP_LOCAL_DIR=./backups               # Diretório local das cópias (montado no contentor como /backups)
BACKUP_S3_ENABLED=true                   # Carregar as cópias para o bucket S3
BACKUP_S3_ENDPOINT=                      # Vazio para AWS S3; endpoint para fornecedores compatíveis com S3
BACKUP_S3_REGION=eu-south-2              # Região do bucket de backups
BACKUP_S3_BUCKET=lca-compare-backup      # Bucket S3 para as cópias de segurança
BACKUP_S3_ACCESS_KEY_ID=                 # Access key do utilizador IAM de backups
BACKUP_S3_SECRET_ACCESS_KEY=             # Secret key do utilizador IAM de backups
```

`DATABASE_URL` não é definida: o compose constrói-a como `postgres://${DB_USER}:${DB_PASSWORD}@db:5432/acv`. Se faltar alguma variável obrigatória, o `docker compose` termina indicando qual.

## Implantação

Com o `.env` preparado, descarregue as imagens e levante a plataforma:

```bash
docker compose pull
docker compose up -d
docker compose ps
```

Ao arrancar, o serviço `migrate` espera que a base de dados esteja pronta e executa `prisma migrate deploy`. Numa base de dados vazia cria o esquema (com a extensão PostGIS) e carrega os dados iniciais: países, províncias, localidades e o método de impacto EF 3.1. Nas implantações seguintes aplica apenas as migrações pendentes. O backend não arranca até que `migrate` termine corretamente; se falhar, consulte `docker compose logs migrate`.

## Criar um Utilizador Administrador

O backend inclui um script para criar um utilizador com o papel `admin`. O script necessita que `DATABASE_URL` esteja disponível e que o backend esteja compilado.

### Em Desenvolvimento Local

Compile o backend e execute o script a partir da raiz do repositório. O script `admin:create` só existe no pacote `server`, pelo que deve ser invocado com `--filter`:

```bash
pnpm server:build
pnpm --filter server admin:create -- --email="admin@example.com" --password="secreto" --nombre="Admin" --apellidos="Plataforma"
```

### Em Produção com Docker

Após o primeiro arranque, execute-o num contentor pontual com a imagem do backend:

```bash
docker compose run --rm lca-compare-backend node apps/server/dist/src/scripts/create-admin.js \
  --email="admin@example.com" --password="secreto" --nombre="Admin" --apellidos="Plataforma"
```

O script valida o email, exige uma palavra-passe de pelo menos 8 caracteres e verifica se já existe um utilizador com o mesmo correio.

## Estrutura do Docker Compose

O ficheiro `deploy/compose.yaml` define o projeto `lca-platform` com os seguintes serviços:

| Serviço | Imagem | Porta | Função |
|---|---|---|---|
| `db` | `postgis/postgis:17-master` | — | PostgreSQL com PostGIS |
| `migrate` | `ghcr.io/quercus-uex/lca-compare-backend` | — | Aplica as migrações do Prisma e termina |
| `lca-compare-backend` | `ghcr.io/quercus-uex/lca-compare-backend` | — | API REST (NestJS) |
| `lca-compare-frontend` | `ghcr.io/quercus-uex/lca-compare-frontend` | 80→80 | SPA e proxy inverso (Nginx) |
| `lca-bridge` | `ghcr.io/quercus-uex/lca-bridge` | — | Cálculo de ACV |
| `openlca-ipc` | `ghcr.io/quercus-uex/openlca-ipc` | — | Servidor IPC do OpenLCA com os dados de `OLCA_DATA_DIR` |
| `db-backup` | `ghcr.io/quercus-uex/lca-compare-backup` | — | Cópias de segurança da base de dados |

### Redes

Todos os serviços partilham a rede do projeto, `lca-platform_default`, e comunicam pelo nome do serviço. Apenas o frontend publica uma porta (80); a base de dados, o backend, o LCA Bridge e o OpenLCA não são acessíveis a partir do exterior. Se precisar de aceder ao PostgreSQL a partir de outra máquina, use um túnel SSH.

### Proxy Inverso (Nginx)

O frontend é servido com Nginx, que atua como proxy inverso com o seguinte encaminhamento:

| Host / caminho | Destino |
|---|---|
| `/api/` | `lca-compare-backend:3000` (API REST, o prefixo `/api` é removido) |
| `/calc` | `lca-bridge:3000/capture-acv` (cálculo de ACV; exige o cabeçalho `x-api-key` com o valor de `CALC_API_KEY`, caso contrário devolve 401) |
| `/` | SPA servida estaticamente (`index.html`) |
| `quercusstatus.duckdns.org` | `uptime-kuma:3001` (Uptime Kuma) |

O Nginx usa upstreams com `resolve` e o DNS interno do Docker (`127.0.0.11`), com uma cache DNS válida durante 10 segundos (`valid=10s`). Assim deteta as alterações de IP dos serviços quando são recriados e atualiza os destinos sem reiniciar o Nginx. Se um serviço não estiver disponível, a sua rota devolve 502 sem impedir o arranque do Nginx. Esta configuração requer Nginx 1.27.3 ou superior.

## Uptime Kuma

O Uptime Kuma é executado no mesmo servidor, mas fora do compose. Liga-se à rede da plataforma para que o Nginx o alcance como `uptime-kuma`, pelo que deve ser levantado depois do primeiro `docker compose up -d`:

```bash
docker run -d --name uptime-kuma --restart unless-stopped \
  --network lca-platform_default -v uptime-kuma:/app/data louislam/uptime-kuma:1
```

Enquanto o Uptime Kuma estiver ligado, `docker compose down` não consegue apagar a rede `lca-platform_default`: mostra um aviso e deixa os restantes serviços parados. `docker compose up -d` reutiliza a rede sem problemas.

Para o atualizar, execute `docker pull louislam/uptime-kuma:1` e `docker rm -f uptime-kuma`, e repita o `docker run` anterior.

## CI/CD

O workflow `.github/workflows/build.yml` é executado em cada push para `main` (e manualmente a partir do GitHub). Constrói e publica no GHCR as imagens `lca-compare-backend`, `lca-compare-frontend` e `lca-compare-backup`, cada uma com as etiquetas `main` e `sha-<hash>`. O repositório do LCA Bridge tem um workflow equivalente que publica `lca-bridge` e `openlca-ipc`.

O GitHub Actions não se liga ao servidor: a implantação é manual.

O repositório também inclui o workflow `.github/workflows/sonar.yml`, que instala dependências, compila `packages/common`, gera o cliente Prisma e executa a cobertura do backend antes da análise do SonarCloud.

## Atualização

Depois de publicadas as novas imagens, atualize o servidor:

```bash
# a partir do equipamento local, apenas se deploy/compose.yaml tiver mudado
scp deploy/compose.yaml <utilizador>@<servidor>:~/lca-platform/compose.yaml

# no servidor
cd ~/lca-platform
docker compose pull
docker compose up -d --remove-orphans
docker image prune -f
```

Para atualizar apenas o LCA Bridge:

```bash
docker compose pull lca-bridge openlca-ipc
docker compose up -d lca-bridge openlca-ipc
```

Para voltar a uma versão anterior, defina `TAG=sha-<hash>` no `.env` e execute `docker compose up -d`. As migrações da base de dados já aplicadas não são revertidas.

## Cópias de segurança

O serviço `db-backup` realiza cópias de segurança automáticas da base de dados. De acordo com `BACKUP_SCHEDULE` (por predefinição, todos os dias às 03:00 UTC) executa `pg_dump` sobre a base `acv` e comprime o resultado com gzip. O destino das cópias controla-se com duas variáveis booleanas, e pelo menos uma deve estar ativada (caso contrário, o comando `backup` termina com erro). Se não forem definidas no `.env`, o compose desativa o S3 e ativa a cópia local:

- **`BACKUP_S3_ENABLED`**: carrega a cópia para `s3://<bucket>/lca-compare-db/daily/`. Aos domingos copia ainda o backup para o prefixo `lca-compare-db/weekly/` para uma retenção mais longa.
- **`BACKUP_LOCAL_ENABLED`**: guarda a cópia num diretório local da máquina. O diretório define-se com `BACKUP_LOCAL_DIR` (predefinição `./backups`, relativo ao `compose.yaml`) e é montado no contentor como `/backups`. As cópias organizam-se da mesma forma que no S3: `daily/` e, aos domingos, `weekly/`.

Se ambos os destinos estiverem ativos, o dump é gerado uma única vez e escrito nos dois. Com apenas o S3 ativo, a cópia é carregada em streaming, sem ocupar disco no servidor.

A retenção das cópias no S3 é aplicada pelas lifecycle rules do bucket (7 diárias e 4 semanais). As cópias locais **não são rodadas automaticamente**: é necessário purgar `BACKUP_LOCAL_DIR` por outros meios (cron, logrotate...).

A imagem é construída a partir de `docker/backup/` (cliente PostgreSQL 17 + AWS CLI + cron) e expõe o comando `backup`, o mesmo que o cron executa, e que também pode ser lançado manualmente.

### Configuração prévia na AWS

Esta configuração só é necessária se `BACKUP_S3_ENABLED=true`. Antes da primeira implantação com backups em S3, é necessário preparar três coisas na conta AWS:

**1. Criar o bucket S3.** O nome deve ser globalmente único (p. ex. `lca-compare-backup`). Mantenha o bloqueio de acesso público ativado (é a predefinição), deixe o versionamento desativado e escolha a região que usará em `BACKUP_S3_REGION` (p. ex. `eu-south-2`).

**2. Criar um utilizador IAM com permissões mínimas.** Crie uma política com este JSON (ajustando o nome do bucket):

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
  --bucket lca-compare-backup \
  --lifecycle-configuration file://lifecycle.json
```

As margens (8 e 29 dias) garantem a conservação de pelo menos 7 e 4 cópias completas, porque a AWS avalia as regras apenas uma vez por dia.

### Execução manual e verificação

O comando `backup` permite lançar uma cópia sob demanda e verificar que tudo funciona:

```bash
# Com o contentor em execução
docker compose exec db-backup backup

# Ou como execução pontual
docker compose run --rm db-backup backup
```

Se tudo correr bem verá `Backup OK: lca-<data>.sql.gz`. Verifique que a cópia está no seu destino:

```bash
# S3
aws s3 ls s3://lca-compare-backup/lca-compare-db/daily/

# Diretório local (o caminho configurado em BACKUP_LOCAL_DIR)
ls ./backups/daily/
```

As execuções programadas ficam registadas nos logs do contentor (`docker compose logs db-backup`).

### Restauro

```bash
# 1. Descarregar o backup (apenas se a cópia estiver no S3; se estiver no diretório local, salte este passo e use esse caminho)
aws s3 cp s3://lca-compare-backup/lca-compare-db/daily/<ficheiro>.sql.gz .

# 2. Parar os serviços que usam a base de dados
docker compose stop lca-compare-backend db-backup

# 3. Recriar a base de dados com a extensão PostGIS
docker compose exec -T db sh -c 'psql -U "$POSTGRES_USER" -d postgres -c "DROP DATABASE acv" -c "CREATE DATABASE acv"'
docker compose exec -T db sh -c 'psql -U "$POSTGRES_USER" -d acv -c "CREATE EXTENSION IF NOT EXISTS postgis"'

# 4. Restaurar e voltar a levantar os serviços
gunzip -c <ficheiro>.sql.gz | docker compose exec -T db sh -c 'psql -U "$POSTGRES_USER" -d acv'
docker compose up -d
```

A cópia inclui a tabela de migrações do Prisma, pelo que, ao voltar a levantar os serviços, `migrate` aplica apenas as migrações posteriores à cópia.

## Verificação

Depois de implantado, verifique se os serviços respondem corretamente:

```bash
# Frontend
curl http://localhost/

# API REST (documentação Swagger)
curl http://localhost/api/docs/

# Cálculo de ACV sem chave de API (deve devolver 401)
curl -i -X POST http://localhost/calc
```
