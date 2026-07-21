---
sidebar_label: 'Trator por setor'
sidebar_position: 6
---

# Medições de atividade de trator por setor

## GET `/sector/:sectorId/tractor/:devEUI`

Obtém as medições de atividade do **trator** associadas a um setor identificado por `sectorId`.  
Permite consultar os minutos totais de operação, bem como o detalhe de utilização por cada implemento detetado.

### Parâmetros

| Tipo    | Nome        | Obrigatório | Descrição                                                        |
| ------- | ----------- | ----------- | ---------------------------------------------------------------- |
| `path`  | `sectorId`  | SIM         | Identificador único do setor (formato UUID)                      |
| `path`  | `devEUI`    | SIM         | Identificador único DevEUI do sensor do trator                   |
| `query` | `startDate` | NÃO         | Data de início do intervalo. Por omissão: `1970-01-01T00:00:00.000Z` |
| `query` | `endDate`   | NÃO         | Data de fim do intervalo. Por omissão: data e hora atual         |

> **Nota:** Para filtrar os dados por datas, utiliza-se o **formato padrão ISO 8601** (`AAAA-MM-DDTHH:mm:ssZ`).

> **Nota:** O identificador do setor pode ser observado clicando num setor em: monitoriza.dtagro.es

### Exemplos de pedido

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

### Resposta bem-sucedida

> **Nota:** O formato de resposta não é definitivo e está sujeito a alterações

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

### Possíveis erros

| Código                      | Causa                            | Mensagem                                      |
| --------------------------- | -------------------------------- | --------------------------------------------- |
| `400 Bad Request`           | Falta o parâmetro `sectorId`     | `Sector ID is required`                       |
| `400 Bad Request`           | Falta o parâmetro `devEUI`       | `Sensor DevEUI is required`                   |
| `400 Bad Request`           | O `sectorId` não é válido        | `Invalid Sector ID (must be UUID)`            |
| `400 Bad Request`           | O `devEUI` não é válido          | `Invalid DevEUI (must be 16 hex characters)`  |
| `401 Unauthorized`          | O token JWT não é válido         | `Invalid authentication token`                |
| `401 Unauthorized`          | O token JWT expirou              | `Authentication token expired`                |
| `401 Unauthorized`          | Falta o token JWT                | `Missing authentication token`                |
| `403 Forbidden`             | Sem permissão para aceder        | `Insufficient scope`                          |
| `404 Not Found`             | O `sectorId` não está registado  | `Sector not found with the provided SectorId` |
| `404 Not Found`             | O `devEUI` não está registado    | `Sensor not found with the provided DevEUI`   |
| `500 Internal Server Error` | Erro interno do servidor         | `Unable to retrieve sensor telemetry`         |
