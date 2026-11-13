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

> **Nota:** O identificador da parcela é apresentado ao selecioná-la em
> [monitoriza.dtagro.es](https://monitoriza.dtagro.es).

Admite ainda os parâmetros de consulta `startDate` e `endDate` (ver [Filtro por datas](./introduccion.md#filtro-por-datas)).

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

Além dos [erros comuns](./introduccion.md#erros-comuns):

| Código                      | Causa                           | Mensagem                                      |
| --------------------------- | ------------------------------- | --------------------------------------------- |
| `400 Bad Request`           | Falta o parâmetro `plotId`      | `Plot ID is required`                         |
| `400 Bad Request`           | Falta o parâmetro `devEUI`      | `Sensor DevEUI is required`                   |
| `400 Bad Request`           | O `plotId` não é válido         | `Invalid Plot ID (must be UUID)`              |
| `400 Bad Request`           | O `devEUI` não é válido         | `Invalid DevEUI (must be 16 hex characters)`  |
| `404 Not Found`             | O `plotId` não está registado   | `Plot not found with the provided PlotId`     |
| `404 Not Found`             | O `devEUI` não está registado   | `Sensor not found with the provided DevEUI`   |
