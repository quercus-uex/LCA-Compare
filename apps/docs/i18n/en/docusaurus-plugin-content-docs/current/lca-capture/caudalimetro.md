---
sidebar_label: 'Flowmeter'
sidebar_position: 3
---

# Flowmeter sensor measurements

## GET `/flowmeter/:devEUI`

Gets the flowmeter sensor data for a specific sensor.  
The sensor is identified by its DevEUI value (Device Extended Unique Identifier).

### Parameters

| Type    | Name        | Required | Description                                            |
| ------- | ----------- | -------- | -------------------------------------------------------|
| `path`  | `devEUI`    | YES      | Unique DevEUI identifier of the flowmeter sensor       |

It also accepts the `startDate` and `endDate` query parameters (see [Date filter](./introduccion.md#date-filter)).

### Request examples

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

### Successful response

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

### Possible errors

In addition to the [common errors](./introduccion.md#common-errors):

| Code                        | Cause                          | Message                                       |
| --------------------------- | ------------------------------ | --------------------------------------------- |
| `400 Bad Request`           | Missing `devEUI` parameter     | `Sensor DevEUI is required`                   |
| `400 Bad Request`           | The `devEUI` is not valid      | `Invalid DevEUI (must be 16 hex characters)`  |
| `404 Not Found`             | The `devEUI` is not registered | `Sensor not found with the provided DevEUI`   |
