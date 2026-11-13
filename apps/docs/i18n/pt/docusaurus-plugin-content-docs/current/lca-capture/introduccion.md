---
sidebar_label: 'Introdução'
sidebar_position: 1
---

# API de medições de sensores (ACV)

Esta API permite obter os dados registados por diferentes sensores (**caudalímetro**, **fertilizante** e **trator**). Todos os endpoints requerem um token JWT (ver [Autenticação](./autenticacion.mdx)).

## Endereço URL base

Todas as rotas da API são construídas a partir deste prefixo:

```
https://monitoriza.dtagro.es/api/acv
```

## Filtro por datas

Os endpoints de sensores admitem dois parâmetros de consulta opcionais para delimitar o intervalo de dados. Se não forem especificados, são devolvidos todos os dados disponíveis do sensor.

| Tipo    | Nome        | Obrigatório | Descrição                                                            |
| ------- | ----------- | ----------- | -------------------------------------------------------------------- |
| `query` | `startDate` | NÃO         | Data de início do intervalo. Por omissão: `1970-01-01T00:00:00.000Z` |
| `query` | `endDate`   | NÃO         | Data de fim do intervalo. Por omissão: data e hora atuais            |

As datas seguem o formato ISO 8601 (`YYYY-MM-DDTHH:mm:ssZ`).

:::note
O formato de resposta dos endpoints de sensores não é definitivo e pode mudar.
:::

## Erros comuns

Além dos erros próprios de cada endpoint, todos os endpoints de sensores podem devolver:

| Código                      | Causa                     | Mensagem                              |
| --------------------------- | ------------------------- | ------------------------------------- |
| `401 Unauthorized`          | O token JWT não é válido  | `Invalid authentication token`        |
| `401 Unauthorized`          | O token JWT expirou       | `Authentication token expired`        |
| `401 Unauthorized`          | Falta o token JWT         | `Missing authentication token`        |
| `403 Forbidden`             | Sem permissão para aceder | `Insufficient scope`                  |
| `500 Internal Server Error` | Erro interno do servidor  | `Unable to retrieve sensor telemetry` |
