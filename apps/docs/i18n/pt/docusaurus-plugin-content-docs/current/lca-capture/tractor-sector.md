---
sidebar_label: 'Trator por setor'
sidebar_position: 6
---

# Medições de atividade de trator por setor

## GET `/sector/:sectorId/tractor/:devEUI`

Obtém as medições de atividade do trator associadas a um setor identificado por `sectorId`.  
Devolve os minutos totais de operação e o detalhe de utilização de cada implemento detetado.

### Parâmetros

| Tipo    | Nome        | Obrigatório | Descrição                                                        |
| ------- | ----------- | ----------- | ---------------------------------------------------------------- |
| `path`  | `sectorId`  | SIM         | Identificador único do setor (formato UUID)                      |
| `path`  | `devEUI`    | SIM         | Identificador único DevEUI do sensor do trator                   |

> **Nota:** O identificador do setor é apresentado ao selecioná-lo em
> [monitoriza.dtagro.es](https://monitoriza.dtagro.es).

Admite ainda os parâmetros de consulta `startDate` e `endDate` (ver [Filtro por datas](./introduccion.md#filtro-por-datas)).

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

Além dos [erros comuns](./introduccion.md#erros-comuns):

| Código                      | Causa                            | Mensagem                                      |
| --------------------------- | -------------------------------- | --------------------------------------------- |
| `400 Bad Request`           | Falta o parâmetro `sectorId`     | `Sector ID is required`                       |
| `400 Bad Request`           | Falta o parâmetro `devEUI`       | `Sensor DevEUI is required`                   |
| `400 Bad Request`           | O `sectorId` não é válido        | `Invalid Sector ID (must be UUID)`            |
| `400 Bad Request`           | O `devEUI` não é válido          | `Invalid DevEUI (must be 16 hex characters)`  |
| `404 Not Found`             | O `sectorId` não está registado  | `Sector not found with the provided SectorId` |
| `404 Not Found`             | O `devEUI` não está registado    | `Sensor not found with the provided DevEUI`   |
