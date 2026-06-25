---
sidebar_label: 'Caudalímetro'
sidebar_position: 3
---

# Mediciones de sensor de caudalímetro

## GET `/flowmeter/:devEUI`

Obtiene los datos del sensor de **caudalímetro (flowmeter)** para un sensor específico.  
El sensor se identifica mediante su valor **DevEUI** (Device Extended Unique Identifier).

### Parámetros

| Tipo    | Nombre      | Requerido | Descripción                                                        |
| ------- | ----------- | --------- | -------------------------------------------------------------------|
| `path`  | `devEUI`    | SÍ        | Identificador único DevEUI del sensor de caudalímetro              |
| `query` | `startDate` | NO        | Fecha de inicio del rango. Por defecto: `1970-01-01T00:00:00.000Z` |
| `query` | `endDate`   | NO        | Fecha de fin del rango. Por defecto: fecha y hora actual           |

> **Nota:** Para filtrar los datos por fechas, se utiliza el **formato estándar ISO 8601** (`AAAA-MM-DDTHH:mm:ssZ`).

### Ejemplos de solicitud

```http
GET https://monitoriza.dtagro.es/api/acv/flowmeter/a84041975a5c2187
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

```http
GET https://monitoriza.dtagro.es/api/acv/flowmeter/a84041975a5c2187?startDate=2026-05-01T00:00:00Z
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

```http
GET https://monitoriza.dtagro.es/api/acv/flowmeter/a84041975a5c2187?startDate=2026-05-01T00:00:00Z&endDate=2026-05-20T00:00:00Z
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Respuesta exitosa

> **Nota:** El formato de respuesta no es definitivo y puede estar sujeto a cambios

```json
{
  "devEUI": "a84041975a5c2187",
  "startDate": "2026-05-01T00:00:00Z",
  "endDate": "2026-05-20T00:00:00Z",
  "data": {
    "rangePulses": 7385,
    "approxLiters": 16.5,
    "exactLiters": 16.41,
    "pulsesPerLiter": 450
  }
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
