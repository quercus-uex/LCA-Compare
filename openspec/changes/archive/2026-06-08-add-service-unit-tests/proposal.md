## Why

Catastro, SIGPAC, and predial polygon lookups transform external geospatial service responses into GeoJSON used by parcel capture, but their behavior is currently not covered by direct unit tests. Adding isolated service tests reduces regression risk around URL construction, response parsing, coordinate conversion, and metadata extraction without relying on external network services.

## What Changes

- Add backend unit tests for `CatastroService.getPolygon` covering cadastral WFS URL construction, XML parsing, and latitude/longitude to longitude/latitude coordinate conversion.
- Add backend unit tests for `SigpacService.getPolygon` covering OGC API query parameter construction and first-feature return behavior.
- Add backend unit tests for `PredialService.getPolygon` covering predial query normalization, required referer header, WKT polygon parsing, EPSG:3857 to WGS84 transformation, and province/population metadata extraction.
- Keep tests isolated with mocked `HttpService` responses and mocked projection behavior where appropriate.

## Capabilities

### New Capabilities
- `backend-geospatial-lookup-unit-tests`: Unit test coverage for backend geospatial lookup services that fetch and transform Catastro, SIGPAC, and predial parcel polygons.

### Modified Capabilities

## Impact

- Affected code: `apps/server/src/catastro`, `apps/server/src/sigpac`, `apps/server/src/predial`.
- Test execution: existing backend Jest command (`pnpm --filter server test`) discovers the new `*.spec.ts` files.
- External systems: no live Catastro, SIGPAC, predial, database, or PostGIS services are required by the new tests.
- Dependencies: no new runtime dependencies expected.
