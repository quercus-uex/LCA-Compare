# Administración del servicio

## Restablecer la base de datos

```bash
npx prisma migrate reset
docker exec -i db psql -U user -d db < init/dbinit.sql
```

## Panel de administración de la base de datos

```bash
npx prisma studio
```