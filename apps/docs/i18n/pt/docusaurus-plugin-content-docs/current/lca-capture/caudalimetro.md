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

Admite ainda os parâmetros de consulta `startDate` e `endDate` (ver [Filtro por datas](./introduccion.md#filtro-por-datas)).

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

Além dos [erros comuns](./introduccion.md#erros-comuns):

| Código                      | Causa                          | Mensagem                                      |
| --------------------------- | ------------------------------ | --------------------------------------------- |
| `400 Bad Request`           | Falta o parâmetro `devEUI`     | `Sensor DevEUI is required`                   |
| `400 Bad Request`           | O `devEUI` não é válido        | `Invalid DevEUI (must be 16 hex characters)`  |
| `404 Not Found`             | O `devEUI` não está registado  | `Sensor not found with the provided DevEUI`   |
