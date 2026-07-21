---
sidebar_label: 'Trator por parcela'
sidebar_position: 5
---

# Medições de atividade de trator por parcela

## GET `/plot/:plotId/tractor/:devEUI`

Obtém as medições de atividade do **trator** associadas a uma parcela identificada por `plotId`.  
Permite consultar os minutos totais de operação, bem como o detalhe de utilização por cada implemento detetado.

### Parâmetros

| Tipo    | Nome        | Obrigatório | Descrição                                                        |
| ------- | ----------- | ----------- | ---------------------------------------------------------------- |
| `path`  | `plotId`    | SIM         | Identificador único da parcela (formato UUID)                    |
| `path`  | `devEUI`    | SIM         | Identificador único DevEUI do sensor do trator                   |
| `query` | `startDate` | NÃO         | Data de início do intervalo. Por omissão: `1970-01-01T00:00:00.000Z` |
| `query` | `endDate`   | NÃO         | Data de fim do intervalo. Por omissão: data e hora atual         |

> **Nota:** Para filtrar os dados por datas, utiliza-se o **formato padrão ISO 8601** (`AAAA-MM-DDTHH:mm:ssZ`).

> **Nota:** O identificador da parcela pode ser observado clicando numa parcela em: monitoriza.dtagro.es

### Exemplos de pedido

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

### Resposta bem-sucedida

> **Nota:** O formato de resposta não é definitivo e pode estar sujeito a alterações

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

### Possíveis erros

| Código                      | Causa                           | Mensagem                                      |
| --------------------------- | ------------------------------- | --------------------------------------------- |
| `400 Bad Request`           | Falta o parâmetro `plotId`      | `Plot ID is required`                         |
| `400 Bad Request`           | Falta o parâmetro `devEUI`      | `Sensor DevEUI is required`                   |
| `400 Bad Request`           | O `plotId` não é válido         | `Invalid Plot ID (must be UUID)`              |
| `400 Bad Request`           | O `devEUI` não é válido         | `Invalid DevEUI (must be 16 hex characters)`  |
| `401 Unauthorized`          | O token JWT não é válido        | `Invalid authentication token`                |
| `401 Unauthorized`          | O token JWT expirou             | `Authentication token expired`                |
| `401 Unauthorized`          | Falta o token JWT               | `Missing authentication token`                |
| `403 Forbidden`             | Sem permissão para aceder       | `Insufficient scope`                          |
| `404 Not Found`             | O `plotId` não está registado   | `Plot not found with the provided PlotId`     |
| `404 Not Found`             | O `devEUI` não está registado   | `Sensor not found with the provided DevEUI`   |
| `500 Internal Server Error` | Erro interno do servidor        | `Unable to retrieve sensor telemetry`         |
