---
sidebar_label: 'Desarrollo'
sidebar_position: 4
---

# Entorno de desarrollo

## Instalación de dependencias

LCA Compare forma parte de un monorepo **pnpm 10** con **Turborepo**. Instala las dependencias desde la raíz del
repositorio, no desde cada aplicación por separado:

```bash
pnpm install
```

El workspace incluye las aplicaciones en `apps/*` y los paquetes compartidos en `packages/*`.

## Base de datos

Inicia la base de datos PostgreSQL con PostGIS:

```bash
docker compose up -d db
```

En desarrollo local, asegúrate de que `DATABASE_URL` apunta a esa base de datos. Con el Compose incluido, la base se crea
como `acv`, por ejemplo `postgres://user:password@localhost:5432/acv` si usas las credenciales del `.env.example`.

Después de una instalación limpia, compila el paquete compartido y genera el cliente de
[Prisma](https://www.prisma.io/docs/orm) antes de compilar o arrancar el backend:

```bash
pnpm --filter common build
pnpm server:prisma:generate
```

El cliente se genera en `apps/server/src/generated/prisma` y el backend lo importa desde esa ruta generada. Para crear o
aplicar migraciones en desarrollo, usa el script del paquete `server`, que carga `apps/server/prisma.config.ts`:

```bash
pnpm --filter server prisma:migrate:dev
```

Carga los datos iniciales (países, provincias, poblaciones):

```bash
docker exec -i db psql -U ${DB_USER} -d acv < init/dbinit.sql
```

## Iniciar los servidores de desarrollo

### Backend (API REST)

```bash
pnpm server:dev
```

El servidor NestJS arranca en `http://localhost:8000` con hot-reload activado. La documentación Swagger estará
disponible en `http://localhost:8000/docs`.

El puerto `8000` depende de la variable `PORT` del `.env`. Si no está definida, NestJS usa el valor por defecto `3000`.

### Frontend (SPA)

```bash
pnpm web:dev
```

El servidor de desarrollo de Vite arranca en `http://localhost:5173`. Las peticiones a `/api` se redirigen
automáticamente al backend en `http://localhost:8000` mediante el proxy configurado en `apps/web/vite.config.ts`.

### Todo el monorepo

```bash
pnpm dev
```

Este comando ejecuta `turbo dev --ui=tui` para arrancar los procesos de desarrollo definidos en los paquetes del
workspace.

### Documentación

```bash
pnpm docs:dev
```

La documentación Docusaurus vive en `apps/docs` y se sirve con `docusaurus start --host 0.0.0.0`.

## Scripts disponibles

### Raíz del workspace

| Comando | Descripción |
|---|---|
| `pnpm install` | Instala las dependencias de todo el workspace |
| `pnpm dev` | Ejecuta Turbo en modo desarrollo para el monorepo |
| `pnpm build` | Compila los paquetes y aplicaciones mediante Turbo |
| `pnpm lint` | Ejecuta los linters configurados mediante Turbo |

### Backend (`apps/server`)

| Comando | Descripción |
|---|---|
| `pnpm server:dev` | Inicia el servidor NestJS en modo desarrollo con hot-reload |
| `pnpm server:build` | Compila el backend |
| `pnpm server:start:prod` | Inicia la versión compilada |
| `pnpm server:test` | Ejecuta los tests unitarios del backend con Jest |
| `pnpm server:lint` | Ejecuta ESLint con las reglas del backend |
| `pnpm server:prisma:generate` | Genera el cliente de Prisma usando `apps/server/prisma.config.ts` |
| `pnpm server:prisma:migrate:deploy` | Aplica migraciones pendientes en entornos desplegados |
| `pnpm --filter server admin:create` | Crea un usuario con rol `admin` (requiere `--email`, `--password`, `--nombre`, `--apellidos`) |

### Frontend (`apps/web`)

| Comando | Descripción |
|---|---|
| `pnpm web:dev` | Inicia el servidor de desarrollo de Vite |
| `pnpm web:build` | Compila TypeScript y construye con Vite |
| `pnpm web:lint` | Ejecuta ESLint |

### Documentación (`apps/docs`)

| Comando | Descripción |
|---|---|
| `pnpm docs:dev` | Inicia Docusaurus en desarrollo |
| `pnpm docs:typecheck` | Verifica la configuración TypeScript de Docusaurus |
| `pnpm docs:build` | Construye el sitio de documentación |

### Paquete compartido (`packages/common`)

| Comando | Descripción |
|---|---|
| `pnpm --filter common build` | Compila DTOs, tipos y constantes compartidos |
| `pnpm --filter common typecheck` | Ejecuta TypeScript sin emitir archivos |

## Estructura del proyecto

```
.
├── apps/
│   ├── server/                    # Backend NestJS
│   │   ├── src/
│   │   │   ├── main.ts            # Bootstrap de la aplicación
│   │   │   ├── app.module.ts      # Módulo raíz
│   │   │   ├── auth/              # Autenticación JWT (login, registro, guards)
│   │   │   ├── usuario/           # CRUD de usuarios
│   │   │   ├── parcela/           # Gestión de parcelas con datos geoespaciales
│   │   │   ├── cultivo/           # Registro y consulta de cultivos
│   │   │   ├── resultadoimpacto/  # Almacenamiento y consulta de resultados ACV
│   │   │   ├── compare/           # Lógica de comparación entre conjuntos de cultivos
│   │   │   ├── capture/           # Recepción de datos desde LCA Bridge
│   │   │   ├── sigpac/            # Integración con SIGPAC
│   │   │   ├── catastro/          # Integración con Catastro
│   │   │   ├── predial/           # Identificador predial portugués
│   │   │   ├── pais/              # Consulta de países
│   │   │   ├── provincia/         # Consulta de provincias
│   │   │   ├── poblacion/         # Consulta de poblaciones
│   │   │   ├── metodoimpacto/     # Métodos de impacto
│   │   │   ├── stats/             # Estadísticas globales y agregaciones para el dashboard
│   │   │   ├── admin/             # CRUD administrativo protegido por rol admin
│   │   │   ├── ai/                # Integración con OpenRouter para IA
│   │   │   ├── mailer/            # Envío de correos electrónicos
│   │   │   ├── prisma/            # PrismaService de acceso a la base de datos
│   │   │   ├── common/            # DTOs y helpers internos del backend
│   │   │   ├── scripts/           # Scripts de utilidad (p. ej. crear usuario admin)
│   │   │   ├── templates/         # Plantillas Handlebars para informes
│   │   │   └── generated/         # Cliente de Prisma autogenerado
│   │   ├── prisma.config.ts       # Configuración de Prisma para el paquete server
│   │   ├── prisma/
│   │   │   ├── schema/            # Esquema Prisma dividido en varios ficheros
│   │   │   │   ├── schema.prisma
│   │   │   │   └── poblacion.prisma
│   │   │   └── migrations/        # Migraciones generadas
│   │   └── Dockerfile             # Imagen del backend
│   ├── web/                       # Frontend React
│   │   ├── src/
│   │   │   ├── main.tsx           # Punto de entrada React
│   │   │   ├── App.tsx            # Componente raíz con rutas
│   │   │   ├── components/        # Componentes reutilizables
│   │   │   ├── hooks/             # Hooks personalizados
│   │   │   ├── stats/             # Componentes de visualización estadística
│   │   │   ├── routes/            # Vistas de la aplicación
│   │   │   ├── common/            # Constantes y utilidades compartidas
│   │   │   └── i18n/              # Internacionalización (es, en, pt)
│   │   ├── nginx.conf             # Proxy inverso de producción
│   │   └── Dockerfile             # Imagen del frontend
│   └── docs/                      # Sitio Docusaurus
├── packages/
│   └── common/                    # DTOs, tipos y constantes compartidos
├── init/
│   └── dbinit.sql                 # Seed SQL manual para países, provincias y poblaciones
├── docker-compose.yaml            # Orquestación de servicios
├── pnpm-workspace.yaml            # Definición de apps/* y packages/*
└── turbo.json                     # Pipeline de Turborepo
```

El backend y el frontend consumen contratos compartidos desde el paquete workspace `common`, por ejemplo mediante
subrutas como `common/impact`, `common/stats`, `common/compare`, `common/location`, `common/parcela`, `common/usuario`,
`common/auth` o `common/api`.

## Esquema de base de datos

![Diagrama ER de la base de datos de LCA Compare](/img/acv-compare/esquema-er.png)

El esquema de Prisma define los siguientes modelos principales:

| Modelo | Descripción |
|---|---|
| `Usuario` | Usuarios con rol (`admin` o usuario estándar) |
| `Parcela` | Parcelas con referencia SIGPAC, catastral, geometría PostGIS y marca de parcela de referencia |
| `Cultivo` | Campañas de cultivo con métricas (superficie, producción, consumo de agua) |
| `ResultadoImpacto` | Resultados de ACV en formato JSON por método de impacto |
| `MetodoImpacto` | Métodos de impacto registrados (identificados por UUID de OpenLCA) |
| `Pais` | Países de referencia para ubicar parcelas |
| `Provincia` | Provincias asociadas a un país y su código catastral |
| `Poblacion` | Poblaciones asociadas a una provincia y su código catastral |

Las relaciones principales son: `Usuario` → `Parcela` → `Cultivo` → `ResultadoImpacto` → `MetodoImpacto`.

La ubicación geográfica se modela con la jerarquía `Pais` → `Provincia` → `Poblacion`, donde cada parcela se asigna a
una población y almacena su polígono en una columna `geometry(Polygon, 4326)` de PostGIS.

La marca `esParcelaReferencia` (por defecto `false`) solo puede asignarla un administrador y permite que el comparador
restrinja un conjunto a estas parcelas mediante el filtro `soloParcelasReferencia`.
