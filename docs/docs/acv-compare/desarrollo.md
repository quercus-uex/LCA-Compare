---
sidebar_label: 'Desarrollo'
sidebar_position: 4
---

# Entorno de desarrollo

## DevContainer

Para el desarrollo del servicio he usado [DevContainers](https://containers.dev), una solución basada en Docker que
permite tener entornos aislados para cada desarrollo. Para hacer uso del mismo solo es necesario abrir el repositorio
del servicio en uno de los IDEs con soporte habilitado para DevContainers (Visual Studio Code, WebStorm, ...).

La configuración del DevContainer (`.devcontainer/devcontainer.json`) incluye el runtime de **Node.js 24**, soporte para
**Docker-in-Docker** y se conecta a la red `capture-acv` con el hostname `acv-compare-service`.

## Instalación de dependencias

Una vez dentro del DevContainer, instala las dependencias tanto del servicio REST como del frontend:

```bash
npm install
cd web
npm install
```

## Base de datos

Inicia la base de datos PostgreSQL con PostGIS:

```bash
docker compose up -d db
```

Genera el cliente de [Prisma](https://www.prisma.io/docs/orm) y aplica las migraciones:

```bash
npx prisma generate
npx prisma migrate dev --name init
```

:::danger[Importante]
La primera migración requiere la extensión **PostGIS**. Si falla, añade `CREATE EXTENSION IF NOT EXISTS postgis;` al
principio del archivo de migración generado y vuelve a ejecutar el comando.
:::

Carga los datos iniciales (países, provincias, poblaciones):

```bash
docker exec -i db psql -U ${DB_USER} -d acv < init/dbinit.sql
```

## Iniciar los servidores de desarrollo

### Backend (API REST)

```bash
npm run start:dev
```

El servidor NestJS arranca en `http://localhost:8000` con hot-reload activado. La documentación Swagger estará
disponible en `http://localhost:8000/docs`.

### Frontend (SPA)

```bash
cd web
npm run dev
```

El servidor de desarrollo de Vite arranca en `http://localhost:5173`. Las peticiones a `/api` se redirigen
automáticamente al backend mediante el proxy configurado en `web/vite.config.ts`.

## Scripts disponibles

### Backend

| Comando | Descripción |
|---|---|
| `npm run start:dev` | Inicia el servidor en modo desarrollo con hot-reload |
| `npm run start:debug` | Inicia el servidor en modo debug |
| `npm run build` | Compila el proyecto |
| `npm run start:prod` | Inicia la versión compilada |
| `npm run lint` | Ejecuta ESLint |
| `npm run format` | Formatea el código con Prettier |
| `npm run test` | Ejecuta los tests unitarios (Jest) |
| `npm run test:cov` | Ejecuta los tests con cobertura |
| `npm run test:e2e` | Ejecuta los tests end-to-end |

### Frontend

| Comando | Descripción |
|---|---|
| `npm run dev` | Inicia el servidor de desarrollo de Vite |
| `npm run build` | Compila TypeScript y construye con Vite |
| `npm run preview` | Previsualiza la build de producción |
| `npm run lint` | Ejecuta ESLint |

## Estructura del proyecto

```
.
├── src/                          # Backend NestJS
│   ├── main.ts                   # Bootstrap de la aplicación
│   ├── app.module.ts             # Módulo raíz
│   ├── auth/                     # Autenticación JWT (login, registro, guards)
│   ├── usuario/                  # CRUD de usuarios
│   ├── parcela/                  # Gestión de parcelas con datos geoespaciales
│   ├── cultivo/                  # Registro y consulta de cultivos
│   ├── resultadoimpacto/         # Almacenamiento y consulta de resultados ACV
│   ├── compare/                  # Lógica de comparación entre conjuntos de cultivos
│   ├── metodoimpacto/            # Configuración de métodos de impacto
│   ├── capture/                  # Recepción de datos desde Capture ACV
│   ├── ai/                       # Integración con OpenRouter para IA
│   │   └── prompts/              # Plantillas Handlebars para prompts
│   ├── sigpac/                   # Integración con API pública de SIGPAC
│   ├── catastro/                 # Integración con API pública de Catastro
│   ├── predial/                  # Servicio de datos prediales
│   ├── pais/                     # Gestión de países
│   ├── provincia/                # Gestión de provincias
│   ├── poblacion/                # Gestión de poblaciones
│   ├── mailer/                   # Servicio de envío de correos
│   ├── admin/                    # Panel de administración (guards, DTOs)
│   ├── templates/                # Plantillas Handlebars para informes
│   └── generated/                # Cliente de Prisma autogenerado
├── web/                          # Frontend React
│   └── src/
│       ├── main.tsx              # Punto de entrada React
│       ├── App.tsx               # Componente raíz con rutas
│       ├── components/           # Componentes reutilizables (navbar, mapa, tabla)
│       ├── hooks/                # Hooks personalizados (auth, compare, parcela, etc.)
│       ├── routes/               # Vistas de la aplicación
│       │   ├── auth/             # Login
│       │   ├── compare/          # Comparador de ACV con filtros
│       │   ├── parcelas/         # Listado y detalle de parcelas
│       │   ├── resultados/       # Visualización de resultados ACV
│       │   └── admin/            # Panel de administración
│       └── utils/                # Utilidades (exportación JSON, centroides)
├── prisma/
│   ├── schema/                   # Esquema de base de datos
│   │   ├── schema.prisma         # Modelos principales
│   │   └── poblacion.prisma      # Modelo de población (extendido)
│   └── migrations/               # Migraciones generadas
├── init/
│   └── dbinit.sql                # Datos iniciales (8.600+ líneas)
├── docker-compose.yaml           # Orquestación de servicios
└── Dockerfile                    # Imagen del backend (multi-stage)
```

## Esquema de base de datos

El esquema de Prisma define los siguientes modelos principales:

| Modelo | Descripción |
|---|---|
| `Usuario` | Usuarios con rol (`admin` o usuario estándar) |
| `Parcela` | Parcelas con referencia SIGPAC, catastral y geometría PostGIS |
| `Cultivo` | Campañas de cultivo con métricas (superficie, producción, consumo de agua) |
| `ResultadoImpacto` | Resultados de ACV en formato JSON por método de impacto |
| `MetodoImpacto` | Métodos de impacto registrados (identificados por UUID de OpenLCA) |

Las relaciones principales son: `Usuario` → `Parcela` → `Cultivo` → `ResultadoImpacto` → `MetodoImpacto`.

La ubicación geográfica se modela con la jerarquía `Pais` → `Provincia` → `Poblacion`, donde cada parcela se asigna a
una población y almacena su polígono en una columna `geometry(Polygon, 4326)` de PostGIS.

## Testing

Los tests del backend se ejecutan con Jest. Los archivos de test siguen la convención `*.spec.ts`:

```bash
# Tests unitarios
npm run test

# Tests con cobertura
npm run test:cov

# Tests end-to-end
npm run test:e2e
```
