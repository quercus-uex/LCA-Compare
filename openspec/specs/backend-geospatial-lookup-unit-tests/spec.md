## Requirements

### Requirement: Geospatial lookup backend unit test isolation
The backend test suite SHALL include geospatial lookup service unit tests that run through the existing server Jest configuration without starting the NestJS HTTP server or connecting to external services.

#### Scenario: Running geospatial lookup unit tests
- **WHEN** a developer runs the backend unit test command
- **THEN** the command SHALL discover and execute Catastro, SIGPAC, and predial `*.spec.ts` files in `apps/server/src`

#### Scenario: Isolated geospatial lookup test execution
- **WHEN** geospatial lookup backend unit tests execute
- **THEN** they SHALL NOT require PostgreSQL, PostGIS, Prisma migrations, Prisma client generation, or network services

### Requirement: CatastroService unit coverage
The test suite SHALL verify `CatastroService.getPolygon` builds the cadastral request and converts cadastral XML polygon coordinates into GeoJSON polygon coordinates.

#### Scenario: Cadastral reference is sent as request query
- **WHEN** `CatastroService.getPolygon` receives a Spanish cadastral reference
- **THEN** it SHALL call `HttpService.get` with the Catastro WFS parcel endpoint
- **THEN** the request URL SHALL include the received cadastral reference as the `refcat` query parameter

#### Scenario: Catastro XML posList is converted to GeoJSON polygon
- **WHEN** Catastro returns a cadastral parcel XML response containing a `gml:posList` with latitude and longitude pairs
- **THEN** `CatastroService.getPolygon` SHALL return a GeoJSON `Feature` with `Polygon` geometry
- **THEN** the returned polygon coordinates SHALL convert each source latitude/longitude pair to longitude/latitude order
- **THEN** the returned feature properties SHALL be an empty object

### Requirement: SigpacService unit coverage
The test suite SHALL verify `SigpacService.getPolygon` builds the SIGPAC request from parcel identifiers and returns the first feature from the service response.

#### Scenario: SIGPAC identifiers are sent as request query
- **WHEN** `SigpacService.getPolygon` receives province, municipality, parcel, and polygon identifiers
- **THEN** it SHALL call `HttpService.get` with the SIGPAC recintos items endpoint
- **THEN** the request URL SHALL include `f=json`, `limit=1`, and the received `provincia`, `municipio`, `parcela`, and `poligono` query parameters

#### Scenario: First SIGPAC feature is returned
- **WHEN** SIGPAC returns a feature collection containing at least one feature
- **THEN** `SigpacService.getPolygon` SHALL return the first feature from the response unchanged

### Requirement: PredialService unit coverage
The test suite SHALL verify `PredialService.getPolygon` builds the predial request, parses WKT polygon data, transforms coordinates, and exposes Portuguese location metadata.

#### Scenario: Predial identifier is normalized in request query
- **WHEN** `PredialService.getPolygon` receives a predial identifier containing spaces
- **THEN** it SHALL call `HttpService.get` with the predial search endpoint
- **THEN** the request URL SHALL include the identifier without spaces as the `filter` query parameter
- **THEN** the request options SHALL include the required SNIC visualizer `Referer` header

#### Scenario: Predial WKT is transformed to GeoJSON polygon
- **WHEN** predial returns a response containing `wkt_3857` polygon data and a `dico` location code
- **THEN** `PredialService.getPolygon` SHALL transform each EPSG:3857 coordinate pair to WGS84 coordinates
- **THEN** it SHALL return a GeoJSON `Feature` with `Polygon` geometry containing the transformed rings
- **THEN** the returned feature properties SHALL include `provincia` from the first two digits of `dico`
- **THEN** the returned feature properties SHALL include `poblacion` from the third and fourth digits of `dico`
