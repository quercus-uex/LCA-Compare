---
sidebar_label: 'Desarrollo'
sidebar_position: 4
---

# Entorno de desarrollo

Para el desarrollo del servicio he usado [DevContainers](https://containers.dev), una solución basada en Docker que
permite tener entornos aislados para cada desarrollo. Para hacer uso del mismo solo es necesario abrir el repositorio
del servicio en uno de los IDEs con soporte habilitado para DevContainers (Visual Studio Code, Webstorm, ...).

Una vez dentro del DevContainer, instalaremos todas las dependencias tanto del servicio REST como del frontend:

```bash
npm install
cd web
npm install
```

Tras instalar las dependencias tendremos que iniciar la base de datos:

```bash
docker compose up -d
```

Para iniciar el servicio REST, lanzamos el servidor de desarrollo de NestJS:

```bash
npm run start:dev
```

Para iniciar el frontend, lanzamos el servidor de desarrollo de Vite:

```bash
cd web
npm run dev
```

