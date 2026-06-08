## Context

`apps/server` es una aplicacion NestJS 11 sin scripts de test ni dependencias de pruebas. La autenticacion actual esta concentrada en `AuthService`, `AuthController` y `AuthGuard`; sus dependencias principales son `UsuarioService`, `JwtService`, `argon2` y el objeto `Request` de Express.

El backend usa TypeScript con `module` y `moduleResolution` en `nodenext`, y no debe requerir base de datos ni Prisma para pruebas unitarias. La primera entrega debe ser pequena: configurar el runner y probar `auth` con mocks, dejando el resto de modulos para incrementos posteriores.

## Goals / Non-Goals

**Goals:**

- Proveer un comando de test unitario para `apps/server` ejecutable con `pnpm --filter server test`.
- Mantener las pruebas de `auth` aisladas mediante mocks de `UsuarioService`, `JwtService`, `argon2` y `ExecutionContext`.
- Cubrir rutas de exito y error de login, wrapping del controlador y validacion del guard JWT.
- Hacer que el setup sea extensible para futuras pruebas unitarias del backend.

**Non-Goals:**

- No introducir pruebas e2e ni levantar la aplicacion Nest completa.
- No conectar a PostgreSQL, PostGIS, Prisma ni servicios externos.
- No cambiar la implementacion funcional de autenticacion, DTOs, rutas ni mensajes de error salvo que sea necesario para testabilidad minima.
- No exigir cobertura global ni umbrales de coverage en esta primera fase.

## Decisions

1. Usar Jest con `ts-jest` para pruebas unitarias del backend.

Jest es el runner esperado en proyectos NestJS generados por CLI y encaja con pruebas de servicios, controladores y guards sin servidor HTTP. La alternativa Vitest tendria una experiencia buena, pero requeriria validar mas integracion con decoradores de Nest y el ecosistema actual no la usa en ningun paquete.

2. Definir una configuracion de Jest especifica para `apps/server`.

La configuracion debe vivir en el paquete server para evitar acoplar web/docs/common al runner del backend. Puede declararse como `jest.config.ts` o como campo `jest` en `package.json`; se prefiere archivo dedicado si simplifica opciones de transform, extensions y patrones `*.spec.ts`.

3. Mantener las pruebas como unitarias puras.

`AuthService` debe instanciarse con mocks tipados o parciales de sus dependencias. `AuthController` debe probar la delegacion directa sin `TestingModule` si no aporta valor. `AuthGuard` debe construir un `ExecutionContext` minimo con `switchToHttp().getRequest()` para validar headers y efectos sobre `request.user`.

4. Mockear `argon2.verify` en lugar de generar hashes reales.

Esto evita coste criptografico, elimina flakiness y permite cubrir claramente los caminos de password valido e invalido. La prueba no valida argon2, valida que `AuthService` reacciona correctamente al resultado de verificacion.

5. Anadir scripts en server y opcionalmente en raiz.

`apps/server/package.json` debe tener `test` y, si se anade cobertura, `test:cov`. El `package.json` raiz puede incluir `server:test` para mantener simetria con `server:build` y `server:lint`.

## Implementation Notes

- Jest necesita mapear imports relativos terminados en `.js` hacia los archivos TypeScript fuente para resolver correctamente imports NodeNext generados por Prisma, por ejemplo `./internal/class.js` -> `./internal/class`.
- `tsconfig.build.json` excluye `**/*.spec.ts` para mantener las pruebas fuera de la compilacion Nest de produccion.

## Risks / Trade-offs

- Jest con NodeNext puede requerir ajustes de transform o extensiones ESM -> Mitigacion: limitar la configuracion a `ts-jest` compatible y verificar con `pnpm --filter server test`.
- Mockear `argon2` reduce realismo criptografico -> Mitigacion: mantenerlo como prueba unitaria y reservar pruebas de integracion para cambios posteriores.
- Pruebas del guard dependen de detalles de `ExecutionContext` -> Mitigacion: usar un mock pequeno y explicito que solo modele `switchToHttp().getRequest()`.
- Nuevas dependencias de dev aumentan instalacion -> Mitigacion: usar el set minimo necesario: Jest, tipos de Jest y transform TypeScript.

## Migration Plan

1. Instalar dependencias de desarrollo de test en `apps/server`.
2. Anadir configuracion y scripts de test.
3. Crear pruebas unitarias para `auth`.
4. Ejecutar `pnpm --filter server test` y `pnpm server:build` para confirmar que el setup no rompe compilacion.

No se requiere rollback de datos. Para revertir, eliminar los scripts/configuracion de test y los archivos `*.spec.ts` anadidos.

## Open Questions

- Ninguna bloqueante para esta fase.
