# ACV Visualizer

## Introducción
ACV Visualizer es una app web que permite la visualización y comparación del Análisis de Ciclo de Vida (ACV) de los cultivos a partir del resultado proporcionado por [Ventum-OpenLCA Bridge](https://github.com/rdereparadores/Ventum-OpenLCA-Service).

## Objetivo
El objetivo final de esta app es proporcionar de una interfaz sencilla e intuitiva que permita la comparación de ACV entre cultivos con el fin de identificar puntos de mejora en esta materia. Para ello, la app permite...
- Analizar el resultado de impacto de un cultivo propio.
- Comparar entre distintos grupos de cultivos según los distintos filtros disponibles.
- Exportar de los resultados de la comparativa a **JSON**.
- Gestionar parcelas con integración de **SIGPAC** y **Catastro** para la localización y representación geoespacial de polígonos.
- Generar informes y reportes automatizados.
- Integración con **IA** para análisis asistido.

## Arquitectura

### Backend (`/src`)
API REST que expone endpoints para:
- **Autenticación** (`/auth`) - Login, registro y gestión de sesiones con JWT
- **Usuarios** (`/usuario`) - CRUD de usuarios con roles
- **Parcelas** (`/parcela`) - Gestión de parcelas con datos geoespaciales
- **Cultivos** (`/cultivo`) - Registro y gestión de cultivos
- **Resultados de impacto** (`/resultadoimpacto`) - Almacenamiento y consulta de resultados ACV
- **Métodos de impacto** (`/predial`) - Configuración de métodos de análisis
- **Comparador** (`/compare`) - Lógica de comparación entre cultivos
- **SIGPAC/Catastro** (`/sigpac`, `/catastro`) - Integración con APIs externas para datos catastrales
- **Ventum** (`/ventum`) - Comunicación con Ventum-OpenLCA Service
- **AI** (`/ai`) - Integración con OpenRouter para análisis asistido
- **Mailer** (`/mailer`) - Servicio de envío de emails

La documentación OpenAPI está disponible en `/docs`.

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
- **Ventum-OpenLCA Service** para el cálculo de análisis de ciclo de vida
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
| `VENTUM_ACV_EMAIL` | Email para autenticación en Ventum |
| `VENTUM_ACV_PASSWORD` | Password para autenticación en Ventum |
| `MAILER_EMAIL` | Email para envío de notificaciones |
| `MAILER_PASSWORD` | Password del servicio de email |
| `DEFAULT_IMPACT_METHOD_UUID` | UUID del método de impacto por defecto |
| `PORT` | Puerto del backend (default: 3000) |

## Despliegue
Para desplegar la infraestructura completa sólo hace falta ejecutar el comando `docker compose up -d`.

El compose levanta tres servicios:
- **acv-compare-backend** - API NestJS (puerto 8080)
- **acv-compare-frontend** - Frontend React servido con Nginx (puerto 80)
- **db** - PostgreSQL con PostGIS (puerto 5432)

### Desarrollo
```bash
# Backend
npm install
npm run start:dev

# Frontend
cd web
npm install
npm run dev
```

## Uso
Por defecto la webapp se encuentra mapeada al puerto 80. La API está disponible a partir de la ruta `/api` y la documentación Swagger en `/docs`.

### Endpoints principales
- `POST /auth/register` - Registro de usuario
- `POST /auth/login` - Login
- `GET /parcela` - Listar parcelas
- `POST /parcela` - Crear parcela
- `GET /cultivo` - Listar cultivos
- `POST /cultivo` - Crear cultivo
- `GET /compare` - Comparar cultivos
- `GET /docs` - Documentación Swagger

## Estructura del proyecto
```
├── src/                    # Backend NestJS
│   ├── auth/               # Autenticación JWT
│   ├── usuario/            # Gestión de usuarios
│   ├── parcela/            # Gestión de parcelas
│   ├── cultivo/            # Gestión de cultivos
│   ├── resultadoimpacto/   # Resultados ACV
│   ├── compare/            # Comparador
│   ├── sigpac/             # Integración SIGPAC
│   ├── catastro/           # Integración Catastro
│   ├── ventum/             # Comunicación con OpenLCA
│   ├── ai/                 # Integración IA
│   ├── mailer/             # Servicio de email
│   ├── templates/          # Plantillas Handlebars
│   └── generated/          # Prisma Client generado
├── web/                    # Frontend React
│   └── src/
├── prisma/
│   └── schema/             # Esquema Prisma
├── init/                   # Scripts de inicialización
├── docker-compose.yaml     # Configuración Docker
└── Dockerfile              # Imagen backend
```
