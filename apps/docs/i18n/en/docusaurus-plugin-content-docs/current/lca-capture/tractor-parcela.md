---
sidebar_label: 'Tractor by plot'
sidebar_position: 5
---

# Tractor activity measurements by plot

## GET `/plot/:plotId/tractor/:devEUI`

Gets the **tractor** activity measurements associated with a plot identified by `plotId`.  
It allows querying the total operation minutes, as well as the usage breakdown per detected implement.

### Parameters

| Type    | Name        | Required | Description                                            |
| ------- | ----------- | -------- | ------------------------------------------------------ |
| `path`  | `plotId`    | YES      | Unique identifier of the plot (UUID format)            |
| `path`  | `devEUI`    | YES      | Unique DevEUI identifier of the tractor sensor         |
| `query` | `startDate` | NO       | Range start date. Default: `1970-01-01T00:00:00.000Z`  |
| `query` | `endDate`   | NO       | Range end date. Default: current date and time         |

> **Note:** The **ISO 8601 standard format** (`YYYY-MM-DDTHH:mm:ssZ`) is used to filter data by date.

> **Note:** The plot identifier can be seen by clicking on a plot at: monitoriza.dtagro.es

### Request examples

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

### Successful response

> **Note:** The response format is not final and may be subject to change

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

### Possible errors

| Code                        | Cause                          | Message                                       |
| --------------------------- | ------------------------------ | --------------------------------------------- |
| `400 Bad Request`           | Missing `plotId` parameter     | `Plot ID is required`                         |
| `400 Bad Request`           | Missing `devEUI` parameter     | `Sensor DevEUI is required`                   |
| `400 Bad Request`           | The `plotId` is not valid      | `Invalid Plot ID (must be UUID)`              |
| `400 Bad Request`           | The `devEUI` is not valid      | `Invalid DevEUI (must be 16 hex characters)`  |
| `401 Unauthorized`          | The JWT token is not valid     | `Invalid authentication token`                |
| `401 Unauthorized`          | The JWT token has expired      | `Authentication token expired`                |
| `401 Unauthorized`          | Missing JWT token              | `Missing authentication token`                |
| `403 Forbidden`             | No permission to access        | `Insufficient scope`                          |
| `404 Not Found`             | The `plotId` is not registered | `Plot not found with the provided PlotId`     |
| `404 Not Found`             | The `devEUI` is not registered | `Sensor not found with the provided DevEUI`   |
| `500 Internal Server Error` | Internal server error          | `Unable to retrieve sensor telemetry`         |
