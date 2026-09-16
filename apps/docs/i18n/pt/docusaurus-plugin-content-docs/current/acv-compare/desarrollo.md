---
sidebar_label: 'Desenvolvimento'
sidebar_position: 4
---

# Ambiente de Desenvolvimento

## Instalação de Dependências

LCA Compare faz parte de um monorepo **pnpm 10** com **Turborepo**. Instale as dependências a partir da raiz do repositório, não a partir de cada aplicação separadamente:

```bash
pnpm install
```

O workspace inclui as aplicações em `apps/*` e os pacotes partilhados em `packages/*`.

## Base de Dados

Inicie a base de dados PostgreSQL com PostGIS:

```bash
docker compose up -d db
```

Em desenvolvimento local, certifique-se de que `DATABASE_URL` aponta para essa base de dados. Com o Compose incluído, a base é criada como `acv`, por exemplo `postgres://user:password@localhost:5432/acv` se usar as credenciais do `.env.example`.

Depois de uma instalação limpa, compile o pacote partilhado e gere o cliente de [Prisma](https://www.prisma.io/docs/orm) antes de compilar ou arrancar o backend:

```bash
pnpm --filter common build
pnpm server:prisma:generate
```

O cliente é gerado em `apps/server/src/generated/prisma` e o backend importa-o a partir dessa rota gerada. Para criar ou aplicar migrações em desenvolvimento, use o script do pacote `server`, que carrega `apps/server/prisma.config.ts`:

```bash
pnpm --filter server prisma:migrate:dev
```

Carregue os dados iniciais (países, províncias, localidades):

```bash
docker exec -i db psql -U ${DB_USER} -d acv < init/dbinit.sql
```

## Iniciar os Servidores de Desenvolvimento

### Backend (API REST)

```bash
pnpm server:dev
```

O servidor NestJS arranca em `http://localhost:8000` com hot reload ativado. A documentação Swagger estará disponível em `http://localhost:8000/docs`.

A porta `8000` depende da variável `PORT` do `.env`. Se não estiver definida, NestJS usa o valor por defeito `3000`.

### Frontend (SPA)

```bash
pnpm web:dev
```

O servidor de desenvolvimento do Vite arranca em `http://localhost:5173`. Os pedidos para `/api` são redirecionados automaticamente para o backend em `http://localhost:8000` através do proxy configurado em `apps/web/vite.config.ts`.

### Todo o Monorepo

```bash
pnpm dev
```

Este comando executa `turbo dev --ui=tui` para arrancar os processos de desenvolvimento definidos nos pacotes do workspace.

### Documentação

```bash
pnpm docs:dev
```

A documentação Docusaurus vive em `apps/docs` e é servida com `docusaurus start --host 0.0.0.0`.

## Scripts Disponíveis

### Raiz do Workspace

| Comando | Descrição |
|---|---|
| `pnpm install` | Instala as dependências de todo o workspace |
| `pnpm dev` | Executa Turbo em modo desenvolvimento para o monorepo |
| `pnpm build` | Compila os pacotes e aplicações através de Turbo |
| `pnpm lint` | Executa os linters configurados através de Turbo |

### Backend (`apps/server`)

| Comando | Descrição |
|---|---|
| `pnpm server:dev` | Inicia o servidor NestJS em modo desenvolvimento com hot reload |
| `pnpm server:build` | Compila o backend |
| `pnpm server:start:prod` | Inicia a versão compilada |
| `pnpm server:test` | Executa os testes unitários do backend com Jest |
| `pnpm server:lint` | Executa ESLint com as regras do backend |
| `pnpm server:prisma:generate` | Gera o cliente Prisma usando `apps/server/prisma.config.ts` |
| `pnpm server:prisma:migrate:deploy` | Aplica migrações pendentes em ambientes implantados |
| `pnpm --filter server admin:create` | Cria um utilizador com o papel `admin` (requer `--email`, `--password`, `--nombre`, `--apellidos`) |

### Frontend (`apps/web`)

| Comando | Descrição |
|---|---|
| `pnpm web:dev` | Inicia o servidor de desenvolvimento do Vite |
| `pnpm web:build` | Compila TypeScript e constrói com Vite |
| `pnpm web:lint` | Executa ESLint |

### Documentação (`apps/docs`)

| Comando | Descrição |
|---|---|
| `pnpm docs:dev` | Inicia Docusaurus em desenvolvimento |
| `pnpm docs:typecheck` | Verifica a configuração TypeScript do Docusaurus |
| `pnpm docs:build` | Constrói o site de documentação |

### Pacote Partilhado (`packages/common`)

| Comando | Descrição |
|---|---|
| `pnpm --filter common build` | Compila DTOs, tipos e constantes partilhados |
| `pnpm --filter common typecheck` | Executa TypeScript sem emitir ficheiros |

## Estrutura do Projeto

```
.
├── apps/
│   ├── server/                    # Backend NestJS
│   │   ├── src/
│   │   │   ├── main.ts            # Bootstrap da aplicação
│   │   │   ├── app.module.ts      # Módulo raiz
│   │   │   ├── auth/              # Autenticação JWT (login, registo, guards)
│   │   │   ├── usuario/           # CRUD de utilizadores
│   │   │   ├── parcela/           # Gestão de parcelas com dados geoespaciais
│   │   │   ├── cultivo/           # Registo e consulta de culturas
│   │   │   ├── resultadoimpacto/  # Armazenamento e consulta de resultados ACV
│   │   │   ├── compare/           # Lógica de comparação entre conjuntos de culturas
│   │   │   ├── capture/           # Receção de dados a partir do LCA Bridge
│   │   │   ├── sigpac/            # Integração com SIGPAC
│   │   │   ├── catastro/          # Integração com Catastro
│   │   │   ├── predial/           # Identificador predial português
│   │   │   ├── pais/              # Consulta de países
│   │   │   ├── provincia/         # Consulta de províncias
│   │   │   ├── poblacion/         # Consulta de localidades
│   │   │   ├── metodoimpacto/     # Métodos de impacto
│   │   │   ├── stats/             # Estatísticas globais e agregações para o dashboard
│   │   │   ├── admin/             # CRUD administrativo protegido por papel admin
│   │   │   ├── ai/                # Integração com OpenRouter para IA
│   │   │   ├── mailer/            # Envio de correios eletrónicos
│   │   │   ├── prisma/            # PrismaService de acesso à base de dados
│   │   │   ├── common/            # DTOs e helpers internos do backend
│   │   │   ├── scripts/           # Scripts utilitários (p. ex. criar utilizador admin)
│   │   │   ├── templates/         # Templates Handlebars para relatórios
│   │   │   └── generated/         # Cliente Prisma autogerado
│   │   ├── prisma.config.ts       # Configuração Prisma para o pacote server
│   │   ├── prisma/
│   │   │   ├── schema/            # Esquema Prisma dividido em vários ficheiros
│   │   │   │   ├── schema.prisma
│   │   │   │   └── poblacion.prisma
│   │   │   └── migrations/        # Migrações geradas
│   │   └── Dockerfile             # Imagem do backend
│   ├── web/                       # Frontend React
│   │   ├── src/
│   │   │   ├── main.tsx           # Ponto de entrada React
│   │   │   ├── App.tsx            # Componente raiz com rotas
│   │   │   ├── components/        # Componentes reutilizáveis
│   │   │   ├── hooks/             # Hooks personalizados
│   │   │   ├── stats/             # Componentes de visualização estatística
│   │   │   ├── routes/            # Vistas da aplicação
│   │   │   ├── common/            # Constantes e utilitários partilhados
│   │   │   └── i18n/              # Internacionalização (es, en, pt)
│   │   ├── nginx.conf             # Proxy inverso de produção
│   │   └── Dockerfile             # Imagem do frontend
│   └── docs/                      # Site Docusaurus
├── packages/
│   └── common/                    # DTOs, tipos e constantes partilhados
├── init/
│   └── dbinit.sql                 # Seed SQL manual para países, províncias e localidades
├── docker-compose.yaml            # Orquestração de serviços
├── pnpm-workspace.yaml            # Definição de apps/* e packages/*
└── turbo.json                     # Pipeline de Turborepo
```

O backend e o frontend consomem contratos partilhados a partir do pacote workspace `common`, por exemplo através de subrotas como `common/impact`, `common/stats`, `common/compare`, `common/location`, `common/parcela`, `common/usuario`, `common/auth` ou `common/api`.

## Esquema da Base de Dados

![Diagrama ER da base de dados do LCA Compare](/img/acv-compare/esquema-er.png)

O esquema Prisma define os seguintes modelos principais:

| Modelo | Descrição |
|---|---|
| `Usuario` | Utilizadores com papel (`admin` ou utilizador padrão) |
| `Parcela` | Parcelas com referência SIGPAC, cadastral, geometria PostGIS e marca de parcela de referência |
| `Cultivo` | Campanhas de cultura com métricas (superfície, produção, consumo de água) |
| `ResultadoImpacto` | Resultados de ACV em formato JSON por método de impacto |
| `MetodoImpacto` | Métodos de impacto registados (identificados por UUID de OpenLCA) |
| `Pais` | Países de referência para localizar parcelas |
| `Provincia` | Províncias associadas a um país e ao seu código cadastral |
| `Poblacion` | Localidades associadas a uma província e ao seu código cadastral |

As relações principais são: `Usuario` → `Parcela` → `Cultivo` → `ResultadoImpacto` → `MetodoImpacto`.

A localização geográfica é modelada com a hierarquia `Pais` → `Provincia` → `Poblacion`, onde cada parcela é atribuída a uma localidade e armazena o seu polígono numa coluna PostGIS `geometry(Polygon, 4326)`.

A marca `esParcelaReferencia` (por omissão `false`) só pode ser atribuída por um administrador e permite que o comparador restrinja um conjunto a estas parcelas através do filtro `soloParcelasReferencia`.
