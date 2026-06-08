## Why

El backend no tiene actualmente un entorno de pruebas unitarias ni scripts de test, lo que dificulta validar cambios en servicios y guards críticos sin levantar la aplicación completa. Empezar por `auth` permite cubrir una ruta pequeña pero sensible: login, generación de JWT y validación de tokens.

## What Changes

- Añadir la configuración mínima de pruebas unitarias para `apps/server`, integrada con TypeScript/NestJS y ejecutable desde scripts de `pnpm`.
- Añadir pruebas unitarias para `AuthService`, incluyendo usuario inexistente, contraseña inválida, contraseña válida y firma del JWT.
- Añadir pruebas unitarias para `AuthController`, validando que delega en el servicio y devuelve el wrapper `{ data }` esperado.
- Añadir pruebas unitarias para `AuthGuard`, cubriendo ausencia de token, formato no Bearer, token inválido y token válido con asignación de `request.user`.
- Mantener las pruebas aisladas con mocks, sin requerir base de datos, Prisma, servidor HTTP ni PostGIS.

## Capabilities

### New Capabilities
- `backend-auth-unit-tests`: Define el entorno de pruebas unitarias del backend y la cobertura inicial para autenticación.

### Modified Capabilities

## Impact

- Afecta a `apps/server/package.json` con nuevos scripts y dependencias de desarrollo para pruebas.
- Afecta a la configuración TypeScript/Jest o equivalente del backend, según la solución mínima compatible con NestJS 11 y NodeNext.
- Añade archivos `*.spec.ts` bajo `apps/server/src/auth/`.
- Puede añadir un script raíz `server:test` si conviene para consistencia con `server:build`, `server:lint` y `server:dev`.
- No cambia APIs públicas, DTOs, comportamiento de autenticación ni esquema de base de datos.
