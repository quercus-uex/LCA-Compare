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
```

Em produção com Docker Compose, `DATABASE_URL` é injetada automaticamente no backend como `postgres://${DB_USER}:${DB_PASSWORD}@db:5432/acv`. O valor do `.env` fica disponível para comandos locais, testes ou desenvolvimento fora do contentor.

## Inicialização da Base de Dados

Em primeiro lugar, é necessário implantar a base de dados. Para isso, levantamos o serviço de base de dados do Docker Compose:

```bash
docker compose up -d db
```

Após implantar a base de dados, aplique as migrações do Prisma a partir do pacote `server`. O esquema está dividido em `apps/server/prisma/schema/` e a configuração do Prisma está em `apps/server/prisma.config.ts`, pelo que os comandos devem ser executados através dos scripts do workspace ou passando explicitamente essa configuração.

```bash
pnpm server:prisma:migrate:deploy
```

Por fim, execute o ficheiro SQL com os dados iniciais (países, províncias, localidades...) disponível em `init/dbinit.sql`. Este ficheiro é um seed SQL manual de dados de referência de Portugal, não uma migração automática:

```bash
docker exec -i db psql -U ${DB_USER} -d acv < init/dbinit.sql
```

## Estrutura do Docker Compose

O ficheiro `docker-compose.yaml` define três serviços. A base de dados é iniciada sem perfil e as aplicações são incluídas apenas com o perfil `prod`:

| Serviço | Imagem | Porta | Perfil |
|---|---|---|---|
| `db` | `postgis/postgis:17-master` | 5432 | *(sempre ativo)* |
| `lca-compare-backend` | Construída a partir de `apps/server/Dockerfile` | 8080→3000 | `prod` |
| `lca-compare-frontend` | Construída a partir de `apps/web/Dockerfile` | 80→80 | `prod` |

### Redes

O compose define duas redes:

- **`acv-compare`**: rede interna para comunicação entre o backend, frontend e base de dados.
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

Isto constrói as imagens do backend e frontend e levanta os três serviços. A imagem do backend compila primeiro `packages/common`, gera o cliente Prisma e depois compila NestJS. Se não aplicou as migrações durante a preparação anterior da base de dados, execute-as agora no contentor do backend usando o script do workspace `server`:

```bash
docker compose exec lca-compare-backend pnpm --filter server prisma:migrate:deploy
```

## CI/CD

O projeto inclui um workflow de GitHub Actions (`.github/workflows/deploy.yml`) executado em cada push para as branches `main` e `develop`. O pipeline:

1. Liga-se por SSH ao servidor de implantação.
2. Clona ou atualiza o repositório na branch correspondente.
3. Reconstrói e levanta os contentores com `docker compose --profile prod up -d --build`.
4. Executa as migrações pendentes com `pnpm --filter server prisma:migrate:deploy` dentro do contentor `lca-compare-backend`.

As variáveis de ambiente sensíveis são injetadas a partir dos secrets do GitHub (`DB_USER`, `DB_PASSWORD`, `JWT_SECRET`, `OPENROUTER_API_KEY`, `CAPTURE_ACV_EMAIL`, `CAPTURE_ACV_PASSWORD`, `MAILER_EMAIL`, `MAILER_PASSWORD` e `DEFAULT_IMPACT_METHOD_UUID`).

O repositório também inclui o workflow `.github/workflows/sonar.yml`, que instala dependências, compila `packages/common`, gera o cliente Prisma e executa a cobertura do backend antes da análise do SonarCloud.

## Verificação

Depois de implantado, verifique se os serviços respondem corretamente:

```bash
# Frontend
curl http://localhost/

# API REST (documentação Swagger)
curl http://localhost/api/docs/
```
