# ACV Visualizer

## Introducción
ACV Visualizer es una app web que permite la visualización y comparación del Análisis de Ciclo de Vida (ACV) de los cultivos a partir del resultado proporcionado por [Ventum-OpenLCA Bridge](https://github.com/rdereparadores/Ventum-OpenLCA-Service).

## Objetivo
El objetivo final de esta app es proporcionar de una interfaz sencilla e intuitiva que permita la comparación de ACV entre cultivos con el fin de identificar puntos de mejora en esta materia. Para ello, la app permite...
- Analizar el resultado de impacto de un cultivo propio.
- Comparar entre distintos grupos de cultivos según los distintos filtros disponibles (**Provincia**, **Población**, **Ubicación** y **Tipo de Cultivo**).
- Exportar de los resultados de la comparativa a **JSON**.

## Tecnologías
A continuación se detallan las tecnologías usadas para el desarrollo de la webapp:

- **NodeJS**
- **NestJS**
- **Prisma ORM**
- **React.js - TailwindCSS - DaisyUI**
- **PostgreSQL con PostGIS**

## Servicios externos
Para la localización de parcelas se ha integrado el uso de las APIs públicas tanto del SIGPAC como del Catastro. Esto permite el almacenamiento del polígono representativo de dichas parcelas para su posterior uso en el comparador.

## Despliegue
Para desplegar la infraestructura completa sólo hace falta ejecutar el comando `docker compose up -d`.

## Uso
Por defecto la webapp se encuentra mapeada al puerto 80. La API está disponible a partir de la ruta `/api`.
