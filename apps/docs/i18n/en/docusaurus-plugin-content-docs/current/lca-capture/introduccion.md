---
sidebar_label: 'Introduction'
sidebar_position: 1
---

# Sensor measurements API (LCA)

This API provides access to the data recorded by different sensors (**flowmeter**, **fertilizer**, and **tractor**). All endpoints require a JWT token (see [Authentication](./autenticacion.mdx)).

## Base URL

All API routes are built from this prefix:

```
https://monitoriza.dtagro.es/api/acv
```

## Date filter

The sensor endpoints accept two optional query parameters to narrow the data range. If they are not specified, **all available data** for the sensor is returned.

| Type    | Name        | Required | Description                                                    |
| ------- | ----------- | -------- | -------------------------------------------------------------- |
| `query` | `startDate` | NO       | Range start date. Default: `1970-01-01T00:00:00.000Z`          |
| `query` | `endDate`   | NO       | Range end date. Default: current date and time                 |

Dates use the **ISO 8601** format (`YYYY-MM-DDTHH:mm:ssZ`).

:::note
The response format of the sensor endpoints is not final and may change.
:::

## Common errors

In addition to the errors specific to each endpoint, all sensor endpoints can return:

| Code                        | Cause                      | Message                               |
| --------------------------- | -------------------------- | ------------------------------------- |
| `401 Unauthorized`          | The JWT token is not valid | `Invalid authentication token`        |
| `401 Unauthorized`          | The JWT token has expired  | `Authentication token expired`        |
| `401 Unauthorized`          | Missing JWT token          | `Missing authentication token`        |
| `403 Forbidden`             | No permission to access    | `Insufficient scope`                  |
| `500 Internal Server Error` | Internal server error      | `Unable to retrieve sensor telemetry` |
