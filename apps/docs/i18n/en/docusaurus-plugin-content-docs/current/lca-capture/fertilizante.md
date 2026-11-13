---
sidebar_label: 'Fertilizer'
sidebar_position: 4
---

# Fertilizer sensor measurements

## GET `/fertilizer/:devEUI`

Gets the **fertilizer** sensor data for a specific sensor.  
The sensor is identified by its **DevEUI** value (Device Extended Unique Identifier).

### Parameters

| Type    | Name        | Required | Description                                            |
| ------- | ----------- | -------- | ------------------------------------------------------ |
| `path`  | `devEUI`    | YES      | Unique DevEUI identifier of the fertilizer sensor      |

It also accepts the `startDate` and `endDate` query parameters (see [Date filter](./introduccion.md#date-filter)).

### Request examples

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

### Successful response

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

### Possible errors

In addition to the [common errors](./introduccion.md#common-errors):

| Code                        | Cause                          | Message                                       |
| --------------------------- | ------------------------------ | --------------------------------------------- |
| `400 Bad Request`           | Missing `devEUI` parameter     | `Sensor DevEUI is required`                   |
| `400 Bad Request`           | The `devEUI` is not valid      | `Invalid DevEUI (must be 16 hex characters)`  |
| `404 Not Found`             | The `devEUI` is not registered | `Sensor not found with the provided DevEUI`   |
