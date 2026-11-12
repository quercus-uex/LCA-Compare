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

## Variables de entorno

El backend lee el `.env` de la raíz del repositorio. Créalo a partir de la plantilla y ajusta sus valores:

```bash
cp .env.example .env
```

`DATABASE_URL`, `JWT_SECRET` y `DEFAULT_IMPACT_METHOD_UUID` son necesarias. OpenRouter y el correo son opcionales: sin
ellos, los informes no incluyen texto generado por IA y no se envía el correo de alta. Mantén `PORT=8000`, que es el
destino del proxy de Vite.

## Base de datos

Inicia la base de datos PostgreSQL con PostGIS:

```bash
docker compose up -d db
```

El Compose crea la base de datos `acv` con las credenciales `DB_USER` y `DB_PASSWORD` del `.env`; con los valores de
la plantilla, `DATABASE_URL` es `postgres://user:password@localhost:5432/acv`.

Después de una instalación limpia, compila el paquete compartido y genera el cliente de
[Prisma](https://www.prisma.io/docs/orm) antes de compilar o arrancar el backend:

```bash
pnpm --filter common build
pnpm server:prisma:generate
```

El cliente se genera en `apps/server/src/generated/prisma` y el backend lo importa desde esa ruta generada.

Aplica las migraciones de `apps/server/prisma/migrations/`. En una base de datos vacía crean el esquema (con la extensión
PostGIS) y cargan los datos iniciales: países, provincias, poblaciones y el método de impacto EF 3.1:

```bash
pnpm server:prisma:migrate:deploy
```

Para cambiar el esquema, edita los ficheros de `apps/server/prisma/schema/` y genera una migración nueva con el script
de desarrollo, que carga `apps/server/prisma.config.ts`:

```bash
pnpm server:prisma:migrate:dev
```

:::warning
No uses `prisma db push`: aplica el esquema sin registrar migraciones y deja la base de datos fuera del historial que
usa el despliegue.
:::

## Iniciar los servidores de desarrollo

### Backend (API REST)

```bash
pnpm server:dev
```

El servidor NestJS arranca en el puerto `PORT` del `.env` (`http://localhost:8000`; sin la variable, `3000`) con
recarga automática. La documentación Swagger está en `http://localhost:8000/docs`.

### Frontend (SPA)

```bash
pnpm web:dev
```

El servidor de desarrollo de Vite arranca en `http://localhost:5173`. Las peticiones a `/api` se redirigen al backend
en `http://localhost:8000` (proxy de `apps/web/vite.config.ts`, que elimina el prefijo `/api`).

En desarrollo, `/dev/ui` muestra el catálogo de la librería de componentes (`src/components/ui`); la ruta no se
incluye en la compilación de producción.

### Todo el monorepo

```bash
pnpm dev
```

Ejecuta `turbo dev --ui=tui`, que arranca a la vez los procesos de desarrollo de todos los paquetes.

### Documentación

```bash
pnpm docs:dev
```

La documentación Docusaurus vive en `apps/docs` y se sirve con `docusaurus start --host 0.0.0.0`.

## Crear un administrador

No hay registro público, así que en una base de datos vacía hace falta un administrador para entrar. Compila el
backend y ejecuta el script desde la raíz del repositorio:

```bash
pnpm server:build
pnpm --filter server admin:create -- --email="admin@example.com" --password="secreto" --nombre="Admin" --apellidos="Plataforma"
```

## Scripts disponibles

### Raíz del workspace

| Comando | Descripción |
|---|---|
| `pnpm install` | Instala las dependencias de todo el workspace |
| `pnpm dev` | Ejecuta Turbo en modo desarrollo para el monorepo |
| `pnpm build` | Compila los paquetes y aplicaciones mediante Turbo |
| `pnpm lint` | Ejecuta los linters configurados mediante Turbo |
| `pnpm screenshots` | Captura las vistas de la web en tamaños de móvil, tablet y escritorio (`utils/responsive-screenshots.mjs`; requiere la web, el backend y `SHOTS_EMAIL`/`SHOTS_PASSWORD`) |

### Backend (`apps/server`)

| Comando | Descripción |
|---|---|
| `pnpm server:dev` | Inicia el servidor NestJS en modo desarrollo con hot-reload |
| `pnpm server:build` | Compila el backend |
| `pnpm server:start:prod` | Inicia la versión compilada |
| `pnpm server:test` | Ejecuta los tests unitarios del backend con Jest |
| `pnpm server:lint` | Ejecuta ESLint con las reglas del backend |
| `pnpm server:prisma:generate` | Genera el cliente de Prisma usando `apps/server/prisma.config.ts` |
| `pnpm server:prisma:migrate:dev` | Crea una migración nueva a partir de los cambios del esquema y la aplica en local |
| `pnpm server:prisma:migrate:deploy` | Aplica las migraciones pendientes (esquema y datos iniciales en una base vacía) |
| `pnpm --filter server admin:create` | Crea un usuario con rol `admin` (ver [Crear un administrador](#crear-un-administrador)) |

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
│   │   │   ├── auth/              # Autenticación JWT (login y guards)
│   │   │   ├── usuario/           # Perfil del usuario autenticado
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
│   │   │   ├── organizacion/      # Organizaciones, consentimientos por campaña y notificaciones
│   │   │   ├── admin/             # CRUD administrativo protegido por rol admin
│   │   │   ├── ai/                # Integración con OpenRouter para IA
│   │   │   ├── mailer/            # Envío de correos electrónicos
│   │   │   ├── prisma/            # PrismaService de acceso a la base de datos
│   │   │   ├── common/            # DTOs y helpers internos del backend
│   │   │   ├── scripts/           # Crear administrador y datos de la demo
│   │   │   ├── templates/         # Plantillas Handlebars para informes
│   │   │   └── generated/         # Cliente de Prisma autogenerado
│   │   ├── prisma.config.ts       # Configuración de Prisma para el paquete server
│   │   ├── prisma/
│   │   │   ├── schema/            # Esquema Prisma dividido en varios ficheros
│   │   │   │   ├── schema.prisma
│   │   │   │   ├── poblacion.prisma
│   │   │   │   └── organizacion.prisma
│   │   │   └── migrations/        # Migraciones versionadas (0_init, 1_seed_datos_iniciales con los datos iniciales y 2_organizaciones)
│   │   └── Dockerfile             # Imagen del backend
│   ├── web/                       # Frontend React
│   │   ├── src/
│   │   │   ├── main.tsx           # Punto de entrada React
│   │   │   ├── App.tsx            # Componente raíz con rutas
│   │   │   ├── components/        # Componentes de la aplicación
│   │   │   │   └── ui/            # Librería de componentes (catálogo en /dev/ui)
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
├── deploy/
│   ├── compose.yaml               # Compose de producción (imágenes de GHCR)
│   ├── .env.example               # Variables de entorno de producción
│   └── demo/                      # Instancia de demostración
├── docker/
│   └── backup/                    # Imagen de copias de seguridad
├── utils/                         # Herramientas de desarrollo (capturas responsive)
├── docker-compose.yaml            # Base de datos para desarrollo
├── pnpm-workspace.yaml            # Definición de apps/* y packages/*
└── turbo.json                     # Pipeline de Turborepo
```

El backend y el frontend consumen contratos compartidos desde el paquete workspace `common`, por ejemplo mediante
subrutas como `common/impact`, `common/stats`, `common/compare`, `common/location`, `common/parcela`, `common/usuario`,
`common/organizacion`, `common/auth` o `common/api`.

## Esquema de base de datos

![Diagrama ER de la base de datos de LCA Compare](/img/acv-compare/esquema-er.png)

El esquema de Prisma define los siguientes modelos principales:

| Modelo | Descripción |
|---|---|
| `Usuario` | Usuarios con rol (`admin` o usuario estándar) |
| `Parcela` | Parcelas con referencia SIGPAC, catastral, geometría PostGIS y marca de parcela de referencia |
| `Cultivo` | Campañas de cultivo con métricas (superficie, producción, consumo de agua) |
| `ResultadoImpacto` | Resultados de ACV en formato JSON por método de impacto |
| `MetodoImpacto` | Métodos de impacto registrados (identificados por UUID de openLCA) |
| `Pais` | Países de referencia para ubicar parcelas |
| `Provincia` | Provincias asociadas a un país y su código catastral |
| `Poblacion` | Poblaciones asociadas a una provincia y su código catastral |
| `Organizacion` | Organizaciones creadas por un usuario, que es su único administrador |
| `Consentimiento` | Acceso de una organización a los datos de un usuario en una campaña (año), con su estado: pendiente, aceptado, rechazado o revocado |
| `Notificacion` | Avisos informativos para un usuario (revocaciones, expulsiones, transferencias…); las solicitudes pendientes se leen de `Consentimiento` |

Las relaciones principales son: `Usuario` → `Parcela` → `Cultivo` → `ResultadoImpacto` → `MetodoImpacto`.

La ubicación geográfica se modela con la jerarquía `Pais` → `Provincia` → `Poblacion`, donde cada parcela se asigna a
una población y almacena su polígono en una columna `geometry(Polygon, 4326)` de PostGIS. Ambos campos son opcionales:
si durante la ingesta no se puede obtener el polígono (SIGPAC, Catastro o predial incorrectos, servicio no disponible o
geometría no válida) o no se encuentra la población, la parcela se guarda igualmente sin ellos y el fallo queda
registrado como aviso en los logs del backend.

La marca `esParcelaReferencia` (por defecto `false`) solo puede asignarla un administrador y permite que el comparador
restrinja un conjunto a estas parcelas mediante el filtro `soloParcelasReferencia`.

El administrador de una organización accede a los datos de un miembro solo en las campañas que este ha aceptado: la
regla vive en `OrganizacionAccesoService` y la usan el detalle de parcelas y resultados, el comparador y las
estadísticas. La campaña es el año UTC de `Cultivo.fechaInicioCampania`. Las parcelas del propio administrador cuentan
solo en las campañas que él mismo aporta (`PUT /organizaciones/:id/campanias-administrador`), guardadas como
consentimientos aceptados. `/compare` y `/stats` siguen siendo públicos: `OptionalAuthGuard` identifica al usuario si envía un token
válido, y filtrar por una organización que no administra responde 403. El filtro `idsParcela` del comparador también
responde 403 sin sesión, y con ella solo alcanza las parcelas del usuario y, de las ajenas, las campañas consentidas a
las organizaciones que administra; el resto de parcelas se ignoran.
