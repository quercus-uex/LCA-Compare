## 1. Catastro Service Tests

- [x] 1.1 Create `apps/server/src/catastro/catastro.service.spec.ts` with a directly instantiated `CatastroService` and mocked `HttpService.get` returning an observable XML response.
- [x] 1.2 Add assertions that the Catastro request uses the WFS parcel endpoint and includes the received cadastral reference as the `refcat` query parameter.
- [x] 1.3 Add assertions that a minimal Catastro XML `gml:posList` is parsed into a GeoJSON `Feature<Polygon>` with longitude/latitude coordinates and empty properties.

## 2. SIGPAC Service Tests

- [x] 2.1 Create `apps/server/src/sigpac/sigpac.service.spec.ts` with a directly instantiated `SigpacService` and mocked `HttpService.get` returning an observable feature collection.
- [x] 2.2 Add assertions that the SIGPAC request uses the recintos items endpoint and includes `f=json`, `limit=1`, `provincia`, `municipio`, `parcela`, and `poligono` query parameters.
- [x] 2.3 Add assertions that `SigpacService.getPolygon` returns the first feature from the mocked SIGPAC response unchanged.

## 3. Predial Service Tests

- [x] 3.1 Create `apps/server/src/predial/predial.service.spec.ts` with a directly instantiated `PredialService`, mocked `HttpService.get`, and deterministic mocked `proj4` transformation.
- [x] 3.2 Add assertions that the predial request uses the predial search endpoint, removes spaces from the identifier in the `filter` query parameter, and sends the required SNIC visualizer `Referer` header.
- [x] 3.3 Add assertions that WKT polygon rings are parsed, every coordinate pair is transformed from EPSG:3857 to WGS84, and the returned GeoJSON feature contains transformed coordinates.
- [x] 3.4 Add assertions that predial `dico` values populate `provincia` from the first two digits and `poblacion` from the third and fourth digits.

## 4. Verification

- [x] 4.1 Run `pnpm --filter server test -- catastro.service.spec.ts sigpac.service.spec.ts predial.service.spec.ts` and fix any failing geospatial service unit tests.
- [x] 4.2 Run `pnpm --filter server test` to confirm the full backend unit test suite still passes.
