---
sidebar_label: 'Tractor by sector'
sidebar_position: 6
---

# Tractor activity measurements by sector

## GET `/sector/:sectorId/tractor/:devEUI`

Gets the **tractor** activity measurements associated with a sector identified by `sectorId`.  
It allows querying the total operation minutes, as well as the usage breakdown per detected implement.

### Parameters

| Type    | Name        | Required | Description                                            |
| ------- | ----------- | -------- | ------------------------------------------------------ |
| `path`  | `sectorId`  | YES      | Unique identifier of the sector (UUID format)          |
| `path`  | `devEUI`    | YES      | Unique DevEUI identifier of the tractor sensor         |
| `query` | `startDate` | NO       | Range start date. Default: `1970-01-01T00:00:00.000Z`  |
| `query` | `endDate`   | NO       | Range end date. Default: current date and time         |

> **Note:** The **ISO 8601 standard format** (`YYYY-MM-DDTHH:mm:ssZ`) is used to filter data by date.

> **Note:** The sector identifier can be seen by clicking on a sector at: monitoriza.dtagro.es

### Request examples

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

### Successful response

> **Note:** The response format is not final and is subject to change

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

### Possible errors

| Code                        | Cause                           | Message                                       |
| --------------------------- | ------------------------------- | --------------------------------------------- |
| `400 Bad Request`           | Missing `sectorId` parameter    | `Sector ID is required`                       |
| `400 Bad Request`           | Missing `devEUI` parameter      | `Sensor DevEUI is required`                   |
| `400 Bad Request`           | The `sectorId` is not valid     | `Invalid Sector ID (must be UUID)`            |
| `400 Bad Request`           | The `devEUI` is not valid       | `Invalid DevEUI (must be 16 hex characters)`  |
| `401 Unauthorized`          | The JWT token is not valid      | `Invalid authentication token`                |
| `401 Unauthorized`          | The JWT token has expired       | `Authentication token expired`                |
| `401 Unauthorized`          | Missing JWT token               | `Missing authentication token`                |
| `403 Forbidden`             | No permission to access         | `Insufficient scope`                          |
| `404 Not Found`             | The `sectorId` is not registered | `Sector not found with the provided SectorId` |
| `404 Not Found`             | The `devEUI` is not registered  | `Sensor not found with the provided DevEUI`   |
| `500 Internal Server Error` | Internal server error           | `Unable to retrieve sensor telemetry`         |
