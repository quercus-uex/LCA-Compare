## 1. Capture Controller Unit Tests

- [x] 1.1 Create `apps/server/src/capture/capture.controller.spec.ts` with mocked `CaptureService` and `ResultadoImpactoService` dependencies.
- [x] 1.2 Add a representative valid capture DTO fixture covering user, parcel, crop, and result metadata.
- [x] 1.3 Verify `postCaptureData` calls `checkUsuario`, `checkParcela`, `ResultadoImpactoService.create`, and `checkCultivo` with the expected arguments.
- [x] 1.4 Verify `postCaptureData` returns `{ usuario, parcela, cultivo }` from the resolved service records.

## 2. Capture Service User Tests

- [x] 2.1 Create `apps/server/src/capture/capture.service.spec.ts` with direct `CaptureService` instantiation and mocked service dependencies.
- [x] 2.2 Mock `argon2.hash` and `generate-password` for deterministic new-user test behavior.
- [x] 2.3 Verify `checkUsuario` returns an existing public user without generating credentials, creating a user, or sending mail.
- [x] 2.4 Verify `checkUsuario` creates a missing user with argon2id password hashing, role `usuario`, and new-user mail notification.

## 3. Capture Service Parcel Tests

- [x] 3.1 Verify `checkParcela` reuses an existing SIGPAC parcel and does not call geospatial lookup or parcel creation dependencies.
- [x] 3.2 Verify `checkParcela` creates a missing SIGPAC parcel using `SigpacService`, Spanish population lookup, computed SIGPAC key, and polygon geometry.
- [x] 3.3 Verify `checkParcela` creates a missing Spanish cadastral parcel using `CatastroService`, Spanish population lookup from reference segments, and polygon geometry.
- [x] 3.4 Verify `checkParcela` creates a missing Portuguese predial parcel using `PredialService`, Portuguese population lookup from polygon properties, and polygon geometry.
- [x] 3.5 Verify `checkParcela` rejects parcel metadata without SIGPAC province, Spanish cadastral reference, or Portuguese predial id.

## 4. Capture Service Crop Tests

- [x] 4.1 Verify `checkCultivo` rejects invalid campaign start dates with `BadRequestException` and avoids crop persistence calls.
- [x] 4.2 Verify `checkCultivo` creates a missing crop with parsed UTC campaign date, crop fields, parcel connection, and impact result connection.
- [x] 4.3 Verify `checkCultivo` updates an existing crop to connect the new impact result and deletes the previous impact result.

## 5. Verification

- [x] 5.1 Run the server Jest command for capture specs and confirm the new tests pass without external services.
- [x] 5.2 Run the broader server unit test command if feasible and confirm existing auth/admin tests still pass.
