---
sidebar_label: 'Flowmeter'
sidebar_position: 3
---

# Flowmeter sensor measurements

## GET `/flowmeter/:devEUI`

Gets the **flowmeter** sensor data for a specific sensor.  
The sensor is identified by its **DevEUI** value (Device Extended Unique Identifier).

### Parameters

| Type    | Name        | Required | Description                                            |
| ------- | ----------- | -------- | -------------------------------------------------------|
| `path`  | `devEUI`    | YES      | Unique DevEUI identifier of the flowmeter sensor       |
| `query` | `startDate` | NO       | Range start date. Default: `1970-01-01T00:00:00.000Z`  |
| `query` | `endDate`   | NO       | Range end date. Default: current date and time         |

> **Note:** The **ISO 8601 standard format** (`YYYY-MM-DDTHH:mm:ssZ`) is used to filter data by date.

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

> **Note:** The response format is not final and may be subject to change

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

| Code                        | Cause                          | Message                                       |
| --------------------------- | ------------------------------ | --------------------------------------------- |
| `400 Bad Request`           | Missing `devEUI` parameter     | `Sensor DevEUI is required`                   |
| `400 Bad Request`           | The `devEUI` is not valid      | `Invalid DevEUI (must be 16 hex characters)`  |
| `401 Unauthorized`          | The JWT token is not valid     | `Invalid authentication token`                |
| `401 Unauthorized`          | The JWT token has expired      | `Authentication token expired`                |
| `401 Unauthorized`          | Missing JWT token              | `Missing authentication token`                |
| `403 Forbidden`             | No permission to access        | `Insufficient scope`                          |
| `404 Not Found`             | The `devEUI` is not registered | `Sensor not found with the provided DevEUI`   |
| `500 Internal Server Error` | Internal server error          | `Unable to retrieve sensor telemetry`         |
