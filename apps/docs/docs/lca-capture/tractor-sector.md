---
sidebar_label: 'Tractor por sector'
sidebar_position: 6
---

# Mediciones de actividad de tractor por sector

## GET `/sector/:sectorId/tractor/:devEUI`

Obtiene las mediciones de actividad del **tractor** asociadas a un sector identificado por `sectorId`.  
Permite consultar los minutos totales de operación, así como el detalle de uso por cada apero detectado.

### Parámetros

| Tipo    | Nombre       | Requerido | Descripción                                                        |
| ------- | ------------ | --------- | ------------------------------------------------------------------ |
| `path`  | `sectorId`   | SÍ        | Identificador único del sector (formato UUID)                      |
| `path`  | `devEUI`     | SÍ        | Identificador único DevEUI del sensor del tractor                  |
| `query` | `startDate`  | NO        | Fecha de inicio del rango. Por defecto: `1970-01-01T00:00:00.000Z` |
| `query` | `endDate`    | NO        | Fecha de fin del rango. Por defecto: fecha y hora actual           |

> **Nota:** Para filtrar los datos por fechas, se utiliza el **formato estándar ISO 8601** (`AAAA-MM-DDTHH:mm:ssZ`).

> **Nota:** El identificador de sector se puede observar clicando en un sector en: monitoriza.dtagro.es

### Ejemplos de solicitud

```http
GET https://monitoriza.dtagro.es/api/acv/sector/a0d42f10-18ce-4b09-a8a9-4ad8c1cc8f76/tractor/008000000a0078bd
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

```http
GET https://monitoriza.dtagro.es/api/acv/sector/a0d42f10-18ce-4b09-a8a9-4ad8c1cc8f76/tractor/008000000a0078bd?startDate=2026-04-01T00:00:00Z
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

```http
GET https://monitoriza.dtagro.es/api/acv/sector/a0d42f10-18ce-4b09-a8a9-4ad8c1cc8f76/tractor/008000000a0078bd?startDate=2026-04-01T00:00:00Z&endDate=2026-04-05T23:59:59Z
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Respuesta exitosa

> **Nota:** El formato de respuesta no es definitivo y está sujeto a cambios

```json
{
    "sectorId": "a0d42f10-18ce-4b09-a8a9-4ad8c1cc8f76",
    "devEUI": "008000000a0078bd",
    "startDate": "2026-04-01T00:00:00Z",
    "endDate": "2026-04-05T23:59:59Z",
    "data": {
        "minutesTotal": 156,
        "minutesFarmEquipment": {
          "tag-0": 34,
          "tag-2": 45,
          "tag-4": 66,
          "tag-7": 11
        }
    }
}
```

### Posibles errores

| Código                      | Causa                            | Mensaje                                       |
| --------------------------- | -------------------------------- | --------------------------------------------- |
| `400 Bad Request`           | Falta el parámetro `sectorId`    | `Sector ID is required`                       |
| `400 Bad Request`           | Falta el parámetro `devEUI`      | `Sensor DevEUI is required`                   |
| `400 Bad Request`           | El `sectorId` no es válido       | `Invalid Sector ID (must be UUID)`            |
| `400 Bad Request`           | El `devEUI` no es válido         | `Invalid DevEUI (must be 16 hex characters)`  |
| `401 Unauthorized`          | El token JWT no es válido        | `Invalid authentication token`                |
| `401 Unauthorized`          | El token JWT ha expirado         | `Authentication token expired`                |
| `401 Unauthorized`          | Falta el token JWT               | `Missing authentication token`                |
| `403 Forbidden`             | Sin permiso para acceder         | `Insufficient scope`                          |
| `404 Not Found`             | El `sectorId` no está registrado | `Sector not found with the provided SectorId` |
| `404 Not Found`             | El `devEUI` no está registrado   | `Sensor not found with the provided DevEUI`   |
| `500 Internal Server Error` | Error interno del servidor       | `Unable to retrieve sensor telemetry`         |
