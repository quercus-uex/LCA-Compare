---
sidebar_label: 'Introducción'
sidebar_position: 1
---

# API de mediciones de sensores (ACV)

Esta API permite obtener los datos registrados por distintos sensores (**caudalímetro**, **fertilizante** y
**tractor**). Todos los endpoints requieren un token JWT (ver [Autenticación](./autenticacion.mdx)).

## Dirección URL base

Todas las rutas de la API se construyen a partir de este prefijo:

```
https://monitoriza.dtagro.es/api/acv
```

## Filtro por fechas

Los endpoints de sensores admiten dos parámetros de consulta opcionales para acotar el rango de datos. Si no se
especifican, se devuelven **todos los datos disponibles** del sensor.

| Tipo    | Nombre      | Requerido | Descripción                                                        |
| ------- | ----------- | --------- | ------------------------------------------------------------------ |
| `query` | `startDate` | NO        | Fecha de inicio del rango. Por defecto: `1970-01-01T00:00:00.000Z` |
| `query` | `endDate`   | NO        | Fecha de fin del rango. Por defecto: fecha y hora actual           |

Las fechas siguen el formato **ISO 8601** (`YYYY-MM-DDTHH:mm:ssZ`).

:::note
El formato de respuesta de los endpoints de sensores no es definitivo y puede cambiar.
:::

## Errores comunes

Además de los errores propios de cada endpoint, todos los endpoints de sensores pueden devolver:

| Código                      | Causa                      | Mensaje                               |
| --------------------------- | -------------------------- | ------------------------------------- |
| `401 Unauthorized`          | El token JWT no es válido  | `Invalid authentication token`        |
| `401 Unauthorized`          | El token JWT ha expirado   | `Authentication token expired`        |
| `401 Unauthorized`          | Falta el token JWT         | `Missing authentication token`        |
| `403 Forbidden`             | Sin permiso para acceder   | `Insufficient scope`                  |
| `500 Internal Server Error` | Error interno del servidor | `Unable to retrieve sensor telemetry` |
