---
sidebar_label: 'Introducción'
sidebar_position: 1
---

# Introducción

**ACV Compare** es una aplicación web que permite la visualización, comparación y generación de informes del Análisis de
Ciclo de Vida (ACV) de cultivos agrícolas. Los resultados de ACV son calculados por
[Capture ACV](https://github.com/quercus-uex/Ventum-OpenLCA-Service), un servicio puente entre la plataforma
DTAgro y el motor de cálculo openLCA con base de datos en formato .zolca. Ambos servicios se comunican a través de una red
Docker compartida.

## Funcionalidades

- **Gestión de parcelas** con integración de SIGPAC, Catastro y el identificador predial portugués para la localización y
  representación geoespacial de polígonos.
- **Visualización de resultados de ACV** por parcela y campaña, desglosados en categorías de impacto (fertilizantes,
  manejo de cultivo, pesticidas, sistema de riego e impacto total).
- **Comparador de ACV** entre dos conjuntos de cultivos filtrando por país, provincia, población, ubicación geográfica
  (radio en km), tipo de cultivo y año de campaña.
- **Generación de informes en PDF** con resumen y recomendaciones generadas por IA a través de OpenRouter.
- **Exportación de resultados a JSON** tanto del conjunto de referencia como del objetivo.
- **Dashboard de estadísticas** con KPIs globales, evolución temporal, rankings por provincia y población, mapas de calor,
  perfiles de impacto y distribución de cultivos.
- **Panel de administración** para la gestión de usuarios, parcelas, cultivos, métodos de impacto, países, provincias y
  poblaciones.
- **Autenticación JWT** con envío automático de credenciales por correo electrónico al primer cálculo de ACV.

## Arquitectura

La aplicación sigue una arquitectura cliente-servidor con dos componentes diferenciados:

| Componente | Tecnología | Puerto |
|---|---|---|
| **Backend (API REST)** | NestJS 11 + Prisma ORM 7 | 3000 (interno) / 8080 (expuesto) |
| **Frontend (SPA)** | React 19 + Vite 7 + TailwindCSS 4 + DaisyUI 5 | 80 |
| **Base de datos** | PostgreSQL 17 + PostGIS | 5432 |

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
- **Sonner** para notificaciones toast
