---
sidebar_label: 'Fertilizante'
sidebar_position: 4
---

# Mediciones de sensor de fertilizante

## GET `/fertilizer/:devEUI`

Obtiene los datos del sensor de **fertilizante (fertilizer)** para un sensor específico.  
El sensor se identifica mediante su valor **DevEUI** (Device Extended Unique Identifier).

### Parámetros

| Tipo    | Nombre      | Requerido | Descripción                                                        |
| ------- | ----------- | --------- | ------------------------------------------------------------------ |
| `path`  | `devEUI`    | SÍ        | Identificador único DevEUI del sensor de fertilizante              |
| `query` | `startDate` | NO        | Fecha de inicio del rango. Por defecto: `1970-01-01T00:00:00.000Z` |
| `query` | `endDate`   | NO        | Fecha de fin del rango. Por defecto: fecha y hora actual           |

> **Nota:** Para filtrar los datos por fechas, se utiliza el **formato estándar ISO 8601** (`AAAA-MM-DDTHH:mm:ssZ`).

### Ejemplos de solicitud

```http
GET https://monitoriza.dtagro.es/api/acv/fertilizer/a84041cac05c2f15
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

```http
GET https://monitoriza.dtagro.es/api/acv/fertilizer/a84041cac05c2f15?startDate=2026-06-01T00:00:00Z
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

```http
GET https://monitoriza.dtagro.es/api/acv/fertilizer/a84041cac05c2f15?startDate=2026-06-01T00:00:00Z&endDate=2026-06-10T23:59:59Z
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Respuesta exitosa

> **Nota:** El formato de respuesta no es definitivo y puede estar sujeto a cambios

```json
{
  "devEUI": "a84041cac05c2f15",
  "startDate": "2026-06-01T00:00:00Z",
  "endDate": "2026-06-10T23:59:59Z",
  "data": [
    {
      "timestamp": "2026-06-03T08:15:00Z",
      "distanceMM": 3332,
      "distanceCM": 333.2,
      "rawValue": 1000
    },
    {
      "timestamp": "2026-06-07T08:40:00Z",
      "distanceMM": 240,
      "distanceCM": 24,
      "rawValue": 997
    },
    {
      "timestamp": "2026-06-10T09:00:00Z",
      "distanceMM": 5463,
      "distanceCM": 546.3,
      "rawValue": 1002
    }
  ]
}
```

### Posibles errores

| Código                      | Causa                          | Mensaje                                       |
| --------------------------- | ------------------------------ | --------------------------------------------- |
| `400 Bad Request`           | Falta el parámetro `devEUI`    | `Sensor DevEUI is required`                   |
| `400 Bad Request`           | El `devEUI` no es válido       | `Invalid DevEUI (must be 16 hex characters)`  |
| `401 Unauthorized`          | El token JWT no es válido      | `Invalid authentication token`                |
| `401 Unauthorized`          | El token JWT ha expirado       | `Authentication token expired`                |
| `401 Unauthorized`          | Falta el token JWT             | `Missing authentication token`                |
| `403 Forbidden`             | Sin permiso para acceder       | `Insufficient scope`                          |
| `404 Not Found`             | El `devEUI` no está registrado | `Sensor not found with the provided DevEUI`   |
| `500 Internal Server Error` | Error interno del servidor     | `Unable to retrieve sensor telemetry`         |
