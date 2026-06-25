---
sidebar_label: 'Tractor por parcela'
sidebar_position: 5
---

# Mediciones de actividad de tractor por parcela

## GET `/plot/:plotId/tractor/:devEUI`

Obtiene las mediciones de actividad del **tractor** asociadas a una parcela identificada por `plotId`.  
Permite consultar los minutos totales de operación, así como el detalle de uso por cada apero detectado.

### Parámetros

| Tipo    | Nombre       | Requerido | Descripción                                                        |
| ------- | ------------ | --------- | ------------------------------------------------------------------ |
| `path`  | `plotId`     | SÍ        | Identificador único de la parcela (formato UUID)                   |
| `path`  | `devEUI`     | SÍ        | Identificador único DevEUI del sensor del tractor                  |
| `query` | `startDate`  | NO        | Fecha de inicio del rango. Por defecto: `1970-01-01T00:00:00.000Z` |
| `query` | `endDate`    | NO        | Fecha de fin del rango. Por defecto: fecha y hora actual           |

> **Nota:** Para filtrar los datos por fechas, se utiliza el **formato estándar ISO 8601** (`AAAA-MM-DDTHH:mm:ssZ`).

> **Nota:** El identificador de parcela se puede observar clicando en una parcela en: monitoriza.dtagro.es

### Ejemplos de solicitud

```http
GET https://monitoriza.dtagro.es/api/acv/plot/c3011f17-ea36-4567-8a52-5fbde300a3f9/tractor/70b3d57ed0071361
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

```http
GET https://monitoriza.dtagro.es/api/acv/plot/c3011f17-ea36-4567-8a52-5fbde300a3f9/tractor/70b3d57ed0071361?startDate=2026-04-01T00:00:00Z
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

```http
GET https://monitoriza.dtagro.es/api/acv/plot/c3011f17-ea36-4567-8a52-5fbde300a3f9/tractor/70b3d57ed0071361?startDate=2026-04-01T00:00:00Z&endDate=2026-04-05T23:59:59Z
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Respuesta exitosa

> **Nota:** El formato de respuesta no es definitivo y puede estar sujeto a cambios

```json
{
    "plotId": "c3011f17-ea36-4567-8a52-5fbde300a3f9",
    "devEUI": "70b3d57ed0071361",
    "startDate": "2026-04-01T00:00:00Z",
    "endDate": "2026-04-05T23:59:59Z",
    "data": {
        "minutesTotal": 57,
        "minutesFarmEquipment": {
          "tag-4": 33,
          "tag-0": 24
        }
    }
}
```

### Posibles errores

| Código                      | Causa                           | Mensaje                                       |
| --------------------------- | ------------------------------- | --------------------------------------------- |
| `400 Bad Request`           | Falta el parámetro `plotId`     | `Plot ID is required`                         |
| `400 Bad Request`           | Falta el parámetro `devEUI`     | `Sensor DevEUI is required`                   |
| `400 Bad Request`           | El `plotId` no es válido        | `Invalid Plot ID (must be UUID)`              |
| `400 Bad Request`           | El `devEUI` no es válido        | `Invalid DevEUI (must be 16 hex characters)`  |
| `401 Unauthorized`          | El token JWT no es válido       | `Invalid authentication token`                |
| `401 Unauthorized`          | El token JWT ha expirado        | `Authentication token expired`                |
| `401 Unauthorized`          | Falta el token JWT              | `Missing authentication token`                |
| `403 Forbidden`             | Sin permiso para acceder        | `Insufficient scope`                          |
| `404 Not Found`             | El `plotId` no está registrado  | `Plot not found with the provided PlotId`     |
| `404 Not Found`             | El `devEUI` no está registrado  | `Sensor not found with the provided DevEUI`   |
| `500 Internal Server Error` | Error interno del servidor	    | `Unable to retrieve sensor telemetry`         |
