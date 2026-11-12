---
sidebar_label: 'Introducción'
sidebar_position: 1
---

# Introducción

**LCA Compare** es una aplicación web para visualizar, comparar y generar informes del Análisis de Ciclo de Vida (ACV)
de cultivos agrícolas. Los resultados los calcula [LCA Bridge](../openlca-bridge/introduccion.md) con openLCA; ambos
servicios se despliegan con el mismo Docker Compose y se comunican por su red interna.

## Funcionalidades

- **Gestión de parcelas** con integración de SIGPAC, Catastro y el identificador predial portugués para la localización y
  representación geoespacial de polígonos.
- **Resultados de ACV** por parcela y campaña: impacto de cada categoría EF 3.1 y su reparto entre fertilizantes, manejo
  de cultivo, pesticidas y sistema de riego.
- **Comparador de ACV** entre un conjunto de referencia y otro objetivo, filtrando por ubicación administrativa o
  geográfica, parcelas propias, tipo de cultivo, año de campaña, parcelas de referencia u organización.
- **Exportación a JSON y CSV** de los resultados y de las comparativas.
- **Informes en PDF** con resumen y recomendaciones generados por IA a través de OpenRouter.
- **Organizaciones** para analizar en conjunto las campañas que otros usuarios consienten compartir.
- **Dashboard de estadísticas** con KPIs globales, evolución temporal, rankings por provincia y población, mapas de calor,
  perfiles de impacto y distribución de cultivos.
- **Panel de administración** para usuarios, parcelas, cultivos, métodos de impacto y datos territoriales, y consulta de
  organizaciones y consentimientos.
- **Alta automática de usuarios**: al recibir el primer cálculo de ACV de un usuario se crea su cuenta y, si el correo
  está configurado, se le envía su contraseña.

## Arquitectura

| Componente | Tecnología | Puerto |
|---|---|---|
| **Backend (API REST)** | NestJS 11 + Prisma ORM 7 | 3000 (interno) |
| **Frontend (SPA)** | React 19 + Vite 7 + TailwindCSS 4 + DaisyUI 5 | 80 (único puerto publicado) |
| **Base de datos** | PostgreSQL 17 + PostGIS | 5432 (interno) |

El backend expone una API REST documentada con Swagger/OpenAPI en la ruta `/docs`. El frontend se sirve mediante Nginx,
que actúa como proxy inverso enrutando las peticiones `/api` al backend y sirviendo la SPA para el resto de rutas.

## Stack tecnológico

### Backend

- **Node.js 22** con **NestJS 11**
- **Prisma ORM 7** sobre PostgreSQL con extensión **PostGIS** para datos geoespaciales
- **JWT** para autenticación
- **Swagger/OpenAPI** para documentación de la API
- **Playwright** para generación de PDFs
- **Handlebars** para plantillas de informes
- **Nodemailer** para envío de correos
- **OpenRouter SDK** para integración con IA
- **proj4** para transformaciones de coordenadas
- **argon2** para hash de contraseñas

### Frontend

- **React 19** con **TypeScript**
- **Vite 7** como bundler
- **TailwindCSS 4** + **DaisyUI 5** para estilos
- **Leaflet / React-Leaflet** para mapas interactivos
- **React Router 7** para enrutamiento
- **React Hook Form** para formularios
- **i18next / react-i18next** para internacionalización de la interfaz
- **Recharts** para gráficas del dashboard de estadísticas
- **Luxon** para fechas
- **Sonner** para notificaciones toast
