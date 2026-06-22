# LCA Compare

## Introducción
LCA Compare es una app web que permite la visualización y comparación del Análisis de Ciclo de Vida (ACV) de los cultivos a partir del resultado proporcionado por [LCA Bridge](https://github.com/rdereparadores/LCA-Bridge).

## Objetivo
El objetivo final de esta app es proporcionar de una interfaz sencilla e intuitiva que permita la comparación de ACV entre cultivos con el fin de identificar puntos de mejora en esta materia. Para ello, la app permite...
- Analizar el resultado de impacto de un cultivo propio.
- Comparar entre distintos grupos de cultivos según los distintos filtros disponibles.
- Exportar de los resultados de la comparativa a **JSON**.
- Gestionar parcelas con integración de **SIGPAC** y **Catastro** para la localización y representación geoespacial de polígonos.
- Generar informes y reportes automatizados.
- Integración con **IA** para análisis asistido.

## Arquitectura

### Backend (`apps/server/src`)
API REST NestJS. Los controladores públicos actuales cubren:
- **Autenticación** (`/auth`) - Login, registro y gestión de sesiones con JWT
- **Usuarios** (`/usuario`) - CRUD de usuarios con roles
- **Parcelas** (`/parcela`) - Gestión de parcelas con datos geoespaciales
- **Resultados de impacto** (`/resultado`) - Almacenamiento y consulta de resultados ACV
- **Comparador** (`/compare`) - Lógica de comparación entre cultivos
- **Estadísticas** (`/stats`) - KPIs y agregaciones para el panel estadístico
- **Administración** (`/admin`) - Operaciones administrativas sobre usuarios, parcelas, cultivos, métodos y ubicaciones
- **Ubicaciones** (`/pais`, `/provincia`, `/poblacion`) - Consulta de datos territoriales
- **LCA Bridge** (`/capture`) - Comunicación con LCA Bridge

La documentación OpenAPI del backend está disponible en `/docs` cuando se accede al servidor directamente, o vía `/api/docs` a través del proxy del frontend.

## Tecnologías
A continuación se detallan las tecnologías usadas para el desarrollo de la webapp:

### Backend
- **Node.js 22**
- **NestJS 11**
- **Prisma ORM 7**
- **PostgreSQL con PostGIS**
- **JWT** para autenticación
- **Swagger/OpenAPI** para documentación
- **Playwright** para generación de reportes
- **Handlebars** para plantillas
- **Nodemailer** para envío de emails
- **OpenRouter SDK** para integración IA
- **proj4** para transformaciones de coordenadas
- **argon2** para hash de contraseñas

### Frontend
- **React 19**
- **TypeScript 5**
- **Vite 7**
- **TailwindCSS 4**
- **DaisyUI 5**
- **Leaflet / React-Leaflet** para mapas
- **React Router 7**
- **React Hook Form**
- **Sonner** para notificaciones

## Servicios externos
Para la localización de parcelas se ha integrado el uso de las APIs públicas tanto del SIGPAC como del Catastro. Esto permite el almacenamiento del polígono representativo de dichas parcelas para su posterior uso en el comparador.

Además, el sistema se comunica con:
- **LCA Bridge** para el cálculo de análisis de ciclo de vida
- **OpenRouter** para capacidades de IA asistida

## Variables de entorno
El proyecto requiere las siguientes variables de entorno (ver `.env.example`):

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | URL de conexión a PostgreSQL |
| `DB_USER` | Usuario de la base de datos |
| `DB_PASSWORD` | Contraseña de la base de datos |
| `JWT_SECRET` | Secret para firmar tokens JWT |
| `OPENROUTER_API_KEY` | API key para OpenRouter |
| `MAILER_EMAIL` | Email para envío de notificaciones |
| `MAILER_PASSWORD` | Password del servicio de email |
| `CAPTURE_ACV_EMAIL` | Email para autenticación en LCA Capture |
| `CAPTURE_ACV_PASSWORD` | Password para autenticación en LCA Capture |
| `DEFAULT_IMPACT_METHOD_UUID` | UUID del método de impacto por defecto (EF 3.1) |
| `PORT` | Puerto del backend; usar `8000` en desarrollo para el proxy de Vite (`3000` es el default de Nest y del contenedor) |

## Despliegue
Para desplegar la infraestructura completa sólo hace falta ejecutar el comando `docker compose --profile prod up -d --build`.

El compose levanta tres servicios:
- **lca-compare-backend** - API NestJS (puerto 8080)
- **lca-compare-frontend** - Frontend React servido con Nginx (puerto 80)
- **db** - PostgreSQL con PostGIS (puerto 5432)

### Desarrollo
```bash
pnpm install
pnpm --filter common build
pnpm server:prisma:generate

pnpm server:dev
pnpm web:dev
pnpm docs:dev
```

## Uso
Por defecto la webapp se encuentra mapeada al puerto 80. La API está disponible a partir de la ruta `/api` y la documentación Swagger a través del proxy en `/api/docs`.

### Endpoints principales
- `POST /auth/register` - Registro de usuario
- `POST /auth/login` - Login
- `GET /parcela` - Listar parcelas
- `POST /parcela` - Crear parcela
- `GET /compare` - Comparar cultivos
- `GET /stats` - Estadísticas globales
- `GET /api/docs` - Documentación Swagger a través del proxy frontend

## Estructura del proyecto
```
├── apps/
│   ├── server/             # Backend NestJS
│   │   ├── src/
│   │   └── prisma/         # Esquema Prisma y configuración asociada
│   ├── web/                # Frontend React
│   │   └── src/
│   └── docs/               # Documentación Docusaurus
├── packages/
│   └── common/             # DTOs, tipos y constantes compartidos por subpath exports
├── init/                   # Scripts de inicialización
├── pnpm-workspace.yaml     # Workspace pnpm
├── turbo.json              # Pipeline Turborepo
└── docker-compose.yaml     # Configuración Docker
```

## Despliegue en la máquina actual
Para desplegar el servicio en la máquina actual, se debe lanzar de forma manual la GitHub Action
configurada para ello (variables de entorno preconfiguradas). En caso de querer lanzarlo manualmente,
se encuentra en la siguiente ruta: `/home/ivan/openlca/Ventum-ACV-Visualizer`.

**IMPORTANTE**: el servicio de LCA Bridge debe haber sido desplegado anteriormente.
