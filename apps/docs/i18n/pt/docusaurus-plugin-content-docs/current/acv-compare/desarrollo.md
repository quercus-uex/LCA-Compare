---
sidebar_label: 'Desenvolvimento'
sidebar_position: 4
---

# Ambiente de Desenvolvimento

## Instalação de Dependências

LCA-Compare faz parte de um monorepo **pnpm 10** com **Turborepo**. Instale as dependências a partir da raiz do repositório, não a partir de cada aplicação separadamente:

```bash
pnpm install
```

O workspace inclui as aplicações em `apps/*` e os pacotes partilhados em `packages/*`.

## Variáveis de Ambiente

O backend lê o `.env` da raiz do repositório. Crie-o a partir do modelo e ajuste os seus valores:

```bash
cp .env.example .env
```

`DATABASE_URL`, `JWT_SECRET` e `DEFAULT_IMPACT_METHOD_UUID` são necessárias. O OpenRouter e o email são opcionais: sem eles, os relatórios não incluem texto gerado por IA e não é enviado o email de criação de conta. Mantenha `PORT=8000`, que é o destino do proxy do Vite.

## Base de Dados

Inicie a base de dados PostgreSQL com PostGIS:

```bash
docker compose up -d db
```

O Compose cria a base de dados `acv` com as credenciais `DB_USER` e `DB_PASSWORD` do `.env`; com os valores do modelo, `DATABASE_URL` é `postgres://user:password@localhost:5432/acv`.

Depois de uma instalação limpa, compile o pacote partilhado e gere o cliente de [Prisma](https://www.prisma.io/docs/orm) antes de compilar ou arrancar o backend:

```bash
pnpm --filter common build
pnpm server:prisma:generate
```

O cliente é gerado em `apps/server/src/generated/prisma` e o backend importa-o a partir dessa rota gerada.

Aplique as migrações de `apps/server/prisma/migrations/`. Numa base de dados vazia, criam o esquema (com a extensão PostGIS) e carregam os dados iniciais: países, províncias, localidades e o método de impacto EF 3.1:

```bash
pnpm server:prisma:migrate:deploy
```

Para alterar o esquema, edite os ficheiros de `apps/server/prisma/schema/` e gere uma nova migração com o script de desenvolvimento, que carrega `apps/server/prisma.config.ts`:

```bash
pnpm server:prisma:migrate:dev
```

:::warning
Não use `prisma db push`: aplica o esquema sem registar migrações e deixa a base de dados fora do histórico usado na implantação.
:::

## Iniciar os Servidores de Desenvolvimento

### Backend (API REST)

```bash
pnpm server:dev
```

O servidor NestJS arranca na porta `PORT` do `.env` (`http://localhost:8000`; sem a variável, `3000`) com recarregamento automático. A documentação Swagger está em `http://localhost:8000/docs`.

### Frontend (SPA)

```bash
pnpm web:dev
```

O servidor de desenvolvimento do Vite arranca em `http://localhost:5173`. Os pedidos para `/api` são redirecionados para o backend em `http://localhost:8000` (proxy de `apps/web/vite.config.ts`, que elimina o prefixo `/api`).

Em desenvolvimento, `/dev/ui` mostra o catálogo da biblioteca de componentes (`src/components/ui`); a rota não é incluída na compilação de produção.

### Todo o Monorepo

```bash
pnpm dev
```

Executa `turbo dev --ui=tui`, que arranca em simultâneo os processos de desenvolvimento de todos os pacotes.

### Documentação

```bash
pnpm docs:dev
```

A documentação Docusaurus vive em `apps/docs` e é servida com `docusaurus start --host 0.0.0.0`.

## Criar um Administrador

Não existe registo público, pelo que numa base de dados vazia é necessário um administrador para entrar. Compile o backend e execute o script a partir da raiz do repositório:

```bash
pnpm server:build
pnpm --filter server admin:create -- --email="admin@example.com" --password="secreto" --nombre="Admin" --apellidos="Plataforma"
```

## Scripts Disponíveis

### Raiz do Workspace

| Comando | Descrição |
|---|---|
| `pnpm install` | Instala as dependências de todo o workspace |
| `pnpm dev` | Executa Turbo em modo desenvolvimento para o monorepo |
| `pnpm build` | Compila os pacotes e aplicações através de Turbo |
| `pnpm lint` | Executa os linters configurados através de Turbo |
| `pnpm screenshots` | Captura as vistas da web em tamanhos de telemóvel, tablet e computador (`utils/responsive-screenshots.mjs`; requer a web, o backend e `SHOTS_EMAIL`/`SHOTS_PASSWORD`) |
| `pnpm docs:screenshots` | Refaz as capturas desta documentação e o esquema ER (`utils/docs-screenshots.mjs`; mesmos requisitos, mais `pdftoppm` para o relatório) |

### Backend (`apps/server`)

| Comando | Descrição |
|---|---|
| `pnpm server:dev` | Inicia o servidor NestJS em modo desenvolvimento com hot reload |
| `pnpm server:build` | Compila o backend |
| `pnpm server:start:prod` | Inicia a versão compilada |
| `pnpm server:test` | Executa os testes unitários do backend com Jest |
| `pnpm server:lint` | Executa ESLint com as regras do backend |
| `pnpm server:prisma:generate` | Gera o cliente Prisma usando `apps/server/prisma.config.ts` |
| `pnpm server:prisma:migrate:dev` | Cria uma nova migração a partir das alterações do esquema e aplica-a localmente |
| `pnpm server:prisma:migrate:deploy` | Aplica as migrações pendentes (esquema e dados iniciais numa base vazia) |
| `pnpm --filter server admin:create` | Cria um utilizador com o papel `admin` (ver [Criar um administrador](#criar-um-administrador)) |

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
│   │   │   ├── auth/              # Autenticação JWT (login e guards)
│   │   │   ├── usuario/           # Perfil do utilizador autenticado
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
│   │   │   ├── organizacion/      # Organizações, consentimentos por campanha e notificações
│   │   │   ├── admin/             # CRUD administrativo protegido por papel admin
│   │   │   ├── ai/                # Integração com OpenRouter para IA
│   │   │   ├── mailer/            # Envio de correios eletrónicos
│   │   │   ├── prisma/            # PrismaService de acesso à base de dados
│   │   │   ├── common/            # DTOs e helpers internos do backend
│   │   │   ├── scripts/           # Criar administrador e dados da demo
│   │   │   ├── templates/         # Templates Handlebars para relatórios
│   │   │   └── generated/         # Cliente Prisma autogerado
│   │   ├── prisma.config.ts       # Configuração Prisma para o pacote server
│   │   ├── prisma/
│   │   │   ├── schema/            # Esquema Prisma dividido em vários ficheiros
│   │   │   │   ├── schema.prisma
│   │   │   │   ├── poblacion.prisma
│   │   │   │   └── organizacion.prisma
│   │   │   └── migrations/        # Migrações versionadas (0_init, 1_seed_datos_iniciales com os dados iniciais e 2_organizaciones)
│   │   └── Dockerfile             # Imagem do backend
│   ├── web/                       # Frontend React
│   │   ├── src/
│   │   │   ├── main.tsx           # Ponto de entrada React
│   │   │   ├── App.tsx            # Componente raiz com rotas
│   │   │   ├── components/        # Componentes da aplicação
│   │   │   │   └── ui/            # Biblioteca de componentes (catálogo em /dev/ui)
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
├── deploy/
│   ├── compose.yaml               # Compose de produção (imagens do GHCR)
│   ├── .env.example               # Variáveis de ambiente de produção
│   └── demo/                      # Instância de demonstração
├── docker/
│   └── backup/                    # Imagem de cópias de segurança
├── utils/                         # Ferramentas de desenvolvimento (capturas responsive)
├── docker-compose.yaml            # Base de dados para desenvolvimento
├── pnpm-workspace.yaml            # Definição de apps/* e packages/*
└── turbo.json                     # Pipeline de Turborepo
```

O backend e o frontend consomem contratos partilhados a partir do pacote workspace `common`, por exemplo através de subrotas como `common/impact`, `common/stats`, `common/compare`, `common/location`, `common/parcela`, `common/usuario`, `common/organizacion`, `common/auth` ou `common/api`.

## Esquema da Base de Dados

![Diagrama ER da base de dados do LCA-Compare](/img/acv-compare/esquema-er.png)

O esquema Prisma define os seguintes modelos principais:

| Modelo | Descrição |
|---|---|
| `Usuario` | Utilizadores com papel (`admin` ou utilizador padrão) |
| `Parcela` | Parcelas com referência SIGPAC, cadastral, geometria PostGIS e marca de parcela de referência |
| `Cultivo` | Campanhas de cultura com métricas (superfície, produção, consumo de água) |
| `ResultadoImpacto` | Resultados de ACV em formato JSON por método de impacto |
| `MetodoImpacto` | Métodos de impacto registados (identificados por UUID de openLCA) |
| `Pais` | Países de referência para localizar parcelas |
| `Provincia` | Províncias associadas a um país e ao seu código cadastral |
| `Poblacion` | Localidades associadas a uma província e ao seu código cadastral |
| `Organizacion` | Organizações criadas por um utilizador, que é o seu único administrador |
| `Consentimiento` | Acesso de uma organização aos dados de um utilizador numa campanha (ano), com o seu estado: pendente, aceite, rejeitado ou revogado |
| `Notificacion` | Avisos informativos para um utilizador (revogações, remoções, transferências…); os pedidos pendentes leem-se de `Consentimiento` |

As relações principais são: `Usuario` → `Parcela` → `Cultivo` → `ResultadoImpacto` → `MetodoImpacto`.

A localização geográfica é modelada com a hierarquia `Pais` → `Provincia` → `Poblacion`, onde cada parcela é atribuída a uma localidade e armazena o seu polígono numa coluna PostGIS `geometry(Polygon, 4326)`. Ambos os campos são opcionais: se durante a ingestão não for possível obter o polígono (identificador SIGPAC, Catastro ou predial incorreto, serviço indisponível ou geometria inválida) ou a localidade não for encontrada, a parcela é guardada na mesma sem eles e a falha fica registada como aviso nos logs do backend.

A marca `esParcelaReferencia` (por omissão `false`) só pode ser atribuída por um administrador e permite que o comparador restrinja um conjunto a estas parcelas através do filtro `soloParcelasReferencia`.

O administrador de uma organização acede aos dados de um membro apenas nas campanhas que este aceitou: a regra vive em `OrganizacionAccesoService` e é usada pelo detalhe de parcelas e resultados, pelo comparador e pelas estatísticas. A campanha é o ano UTC de `Cultivo.fechaInicioCampania`. As parcelas do próprio administrador contam apenas nas campanhas com que ele próprio contribui (`PUT /organizaciones/:id/campanias-administrador`), guardadas como consentimentos aceites. `/compare` e `/stats` continuam públicos: o `OptionalAuthGuard` identifica o utilizador se enviar um token válido, e filtrar por uma organização que não administra responde 403. O filtro `idsParcela` do comparador também responde 403 sem sessão; com sessão só alcança as parcelas do utilizador e, das alheias, as campanhas consentidas às organizações que administra; as restantes parcelas são ignoradas.
