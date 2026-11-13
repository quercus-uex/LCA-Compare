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

Admite además los parámetros de consulta `startDate` y `endDate` (ver
[Filtro por fechas](./introduccion.md#filtro-por-fechas)).

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

Además de los [errores comunes](./introduccion.md#errores-comunes):

| Código                      | Causa                          | Mensaje                                       |
| --------------------------- | ------------------------------ | --------------------------------------------- |
| `400 Bad Request`           | Falta el parámetro `devEUI`    | `Sensor DevEUI is required`                   |
| `400 Bad Request`           | El `devEUI` no es válido       | `Invalid DevEUI (must be 16 hex characters)`  |
| `404 Not Found`             | El `devEUI` no está registrado | `Sensor not found with the provided DevEUI`   |
