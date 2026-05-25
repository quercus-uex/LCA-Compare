---
sidebar_label: 'Despliegue'
sidebar_position: 2
---

# Despliegue del servicio

Antes de desplegar el servicio de comparativa de ACV, necesitas tener clonado el repositorio del mismo ([https://github.com/quercus-uex/Ventum-ACV-Visualizer](https://github.com/quercus-uex/Ventum-ACV-Visualizer)).

## Variables de entorno
Deberás configurar las siguientes variables de entorno para el despliegue:

```sh
JWT_SECRET="CHANGEME" # Clave secreta para JWT (autenticación)
OPENROUTER_API_KEY="sk-or-v1-...." # Clave de API para OpenRouter (generación de recomendaciones en informes)

DB_USER="user" # Usuario de la base de datos
DB_PASSWORD="password" # Contraseña de la base de datos

MAILER_EMAIL="example@example.com" # Correo electrónico para envío de notificaciones (nuevo registro)
MAILER_PASSWORD="Password" # Contraseña del correo electrónico para envío de notificaciones (nuevo registro)

DEFAULT_IMPACT_METHOD_UUID="2f995579-06bd-4681-b07c-cee3b1805b0d" # UUID del método de impacto utilizado por defecto
```

## Inicialización de la base de datos
En primer lugar, es necesario desplegar la base de datos. Para ello, levantamos el Docker Compose:

```bash
docker compose up -d
```

Tras deplegar la base de datos, tendremos que lanzar la migración inicial para crear las tablas y relaciones definidas
en el esquema de Prisma.

:::danger[Importante]
Al crear la migración, es normal que la primera vez lance un error, puesto que esta requiere de la extensión **PostGIS**.
Para solucionar esto, abre el archivo .sql de la migración (`prisma/migrations/2026..../migration.sql`) y añade la
siguiente línea al principio:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

Una vez hecho vuelve a lanzar la migración con el mismo nombre.
:::

```bash
npx prisma migrate dev --name init
```

Por último, hay que ejecutar el archivo .sql con los datos iniciales (provincias, poblaciones...) disponible en `init/dbinit.sql`:

```bash
docker exec -i <id_contenedor> psql -U <usuario_db> -d <nombre_db> < init/dbinit.sql
```


## Despliegue del servicio

Una vez tengamos la base de datos preparada, para desplegar el servicio completo desplegamos el Docker Compose con el
perfil de producción:

```bash
docker compose --profile prod up -d --build
```