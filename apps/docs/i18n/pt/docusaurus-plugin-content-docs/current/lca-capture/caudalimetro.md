---
sidebar_label: 'Caudalímetro'
sidebar_position: 3
---

# Medições de sensor de caudalímetro

## GET `/flowmeter/:devEUI`

Obtém os dados do sensor de **caudalímetro (flowmeter)** para um sensor específico.  
O sensor é identificado pelo seu valor **DevEUI** (Device Extended Unique Identifier).

### Parâmetros

| Tipo    | Nome        | Obrigatório | Descrição                                                        |
| ------- | ----------- | ----------- | -----------------------------------------------------------------|
| `path`  | `devEUI`    | SIM         | Identificador único DevEUI do sensor de caudalímetro             |
| `query` | `startDate` | NÃO         | Data de início do intervalo. Por omissão: `1970-01-01T00:00:00.000Z` |
| `query` | `endDate`   | NÃO         | Data de fim do intervalo. Por omissão: data e hora atual         |

> **Nota:** Para filtrar os dados por datas, utiliza-se o **formato padrão ISO 8601** (`AAAA-MM-DDTHH:mm:ssZ`).

### Exemplos de pedido

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

### Resposta bem-sucedida

> **Nota:** O formato de resposta não é definitivo e pode estar sujeito a alterações

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

### Possíveis erros

| Código                      | Causa                          | Mensagem                                      |
| --------------------------- | ------------------------------ | --------------------------------------------- |
| `400 Bad Request`           | Falta o parâmetro `devEUI`     | `Sensor DevEUI is required`                   |
| `400 Bad Request`           | O `devEUI` não é válido        | `Invalid DevEUI (must be 16 hex characters)`  |
| `401 Unauthorized`          | O token JWT não é válido       | `Invalid authentication token`                |
| `401 Unauthorized`          | O token JWT expirou            | `Authentication token expired`                |
| `401 Unauthorized`          | Falta o token JWT              | `Missing authentication token`                |
| `403 Forbidden`             | Sem permissão para aceder      | `Insufficient scope`                          |
| `404 Not Found`             | O `devEUI` não está registado  | `Sensor not found with the provided DevEUI`   |
| `500 Internal Server Error` | Erro interno do servidor       | `Unable to retrieve sensor telemetry`         |
