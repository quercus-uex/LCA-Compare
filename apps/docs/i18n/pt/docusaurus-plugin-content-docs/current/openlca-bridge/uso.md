---
sidebar_label: 'Utilização'
sidebar_position: 3
---

# Utilização do Serviço

## Endpoints

O serviço expõe dois endpoints. Ambos recebem como corpo o JSON de uma cultura exportado pelo LCA Capture (ver [JSON de entrada](./json-entrada.md)), devolvem o mesmo resultado e enviam-no para o LCA Compare:

| Endpoint | Descrição |
|---|---|
| `POST /capture-acv` | Escreve os fluxos da cultura nos processos do openLCA e calcula o sistema de produto (cerca de 6-7 s por cultura). |
| `POST /capture-acv-coeficientes` | Calcula como combinação linear das quantidades dos fluxos com coeficientes de impacto obtidos do openLCA, sem escrever em openLCA. O primeiro pedido de cada cultura extrai os coeficientes (até um minuto) e guarda-os em memória; os seguintes demoram milissegundos. Se a base de dados do openLCA mudar, é necessário reiniciar o serviço. |

Ambos os endpoints dão o mesmo resultado, salvo pelo arredondamento, porque os sistemas de produto são lineares nas quantidades escritas.

## Fluxo de Processamento

```
POST /capture-acv    →    ACVService.execute()
                         ├── validate_parcela()
                         ├── get_process_class()  →  TomateProcess | OlivoProcess | VinedoProcess
                         ├── validate_cultivo()
                         ├── calculate()          →  sob olca_lock
                         │   ├── update_processes()   →  OLCAClient (olca-ipc)
                         │   ├── calculate_impacts()  →  sistema de produto (process.uuid)
                         │   └── build_final_result()
                         └── send_result_to_lca_compare()  →  POST {LCA_COMPARE_BASE_URL}/capture
```

1. **`validate_parcela()`**: exige pelo menos um identificador de parcela (SIGPAC com província, referência cadastral ou código predial).
2. **`get_process_class()`**: seleciona a classe de processo de acordo com `metadatos.cultivo.tipo` (`"Tomate"`, `"Olivo"` ou `"Viñedo"`).
3. **`validate_cultivo()`**: verifica que `metadatos.cultivo.produccion`, `metadatos.cultivo.superficie_cultivada`, `riegos.entre_calles` e, com gotejadores de inserção, `riegos.entre_arboles` são maiores que 0.
4. **`calculate()`**: escreve os fluxos nos subprocessos do openLCA, calcula o sistema de produto e constrói o resultado. Os processos do openLCA são partilhados, pelo que estes passos são serializados com um bloqueio (`olca_lock`): os pedidos concorrentes são atendidos um de cada vez.
5. **`send_result_to_lca_compare()`**: envia o resultado para o LCA Compare (best-effort: os erros são registados no log sem interromper a resposta).

`POST /capture-acv-coeficientes` segue o mesmo fluxo, mas substitui `calculate()` por `calculate_con_coeficientes()`, que só usa o bloqueio na primeira vez, para extrair os coeficientes.

## Resposta do Serviço

A resposta contém cinco listas de impactos. Cada elemento indica a categoria de impacto do EF 3.1 (`category`), a quantidade por kg de produto (`amount`) e a sua unidade (`unit`). Cada lista inclui todas as categorias do método (25 no exemplo). O seguinte excerto de `examples/example_out.json` do repositório do LCA Bridge está **truncado** a três categorias e com os valores arredondados:

```json
{
    "impacto_fertilizantes": [
        { "category": "Acidification", "amount": 0.004324, "unit": "mol H+ eq" },
        { "category": "Water use", "amount": -0.01905, "unit": "m3 world eq" },
        { "category": "Climate change", "amount": 0.9131, "unit": "kg CO2 eq" }
    ],
    "impacto_manejo_cultivo": [
        { "category": "Acidification", "amount": 0.002339, "unit": "mol H+ eq" },
        { "category": "Water use", "amount": 0.2733, "unit": "m3 world eq" },
        { "category": "Climate change", "amount": 0.4017, "unit": "kg CO2 eq" }
    ],
    "impacto_pesticidas": [
        { "category": "Acidification", "amount": 0.000004240, "unit": "mol H+ eq" },
        { "category": "Water use", "amount": -0.00002757, "unit": "m3 world eq" },
        { "category": "Climate change", "amount": 0.0003020, "unit": "kg CO2 eq" }
    ],
    "impacto_sistema_riego": [
        { "category": "Acidification", "amount": 0.00001233, "unit": "mol H+ eq" },
        { "category": "Water use", "amount": 0.1141, "unit": "m3 world eq" },
        { "category": "Climate change", "amount": 0.004235, "unit": "kg CO2 eq" }
    ],
    "impacto_total": [
        { "category": "Acidification", "amount": 0.006679, "unit": "mol H+ eq" },
        { "category": "Water use", "amount": 0.3683, "unit": "m3 world eq" },
        { "category": "Climate change", "amount": 1.319, "unit": "kg CO2 eq" }
    ]
}
```

| Lista | Descrição |
|---|---|
| `impacto_fertilizantes` | Fertilizantes aplicados e emissões da fertilização (NH₃, N₂O, NO₃, NOₓ). |
| `impacto_manejo_cultivo` | Operações agrícolas, colheita, ocupação do solo e uso de água. |
| `impacto_pesticidas` | Produção dos fitofármacos e emissões das suas substâncias ativas. |
| `impacto_sistema_riego` | Materiais do sistema de rega e energia de bombagem. |
| `impacto_total` | Impacto total do sistema de produto. Em Olivo e Viñedo inclui ainda o subprocesso "Estructuras permanentes" (espaldeira e casa de rega), que não tem lista própria. |

Para o LCA Compare é enviado `{ "metadatos": <metadados da entrada>, "resultado": <resposta> }`.

## Códigos de Resposta

| Código | Causa |
|---|---|
| `200` | Cálculo correto. |
| `400` | Dados inválidos: sem identificador de parcela, tipo de cultura ou de rega desconhecido, fitofármaco sem classificação reconhecida ou um divisor (`produccion`, `superficie_cultivada`, `entre_calles`, `entre_arboles`) menor ou igual a 0. |
| `422` | O JSON não cumpre o esquema (campos obrigatórios ausentes, tipos incorretos ou campos não definidos). |
| `500` | Erro do openLCA (`"Error de OpenLCA: ..."`) ou servidor IPC indisponível (`"Error al conectar a OpenLCA"`). |

## Integração com LCA Compare

No compose da plataforma, o resultado é enviado para `POST /capture` do LCA Compare, cujo URL base é configurado com `LCA_COMPARE_BASE_URL`. A partir do exterior, o cálculo é exposto através do proxy inverso Nginx do frontend do LCA Compare:

| Rota | Destino |
|---|---|
| `/calc` | `lca-bridge:3000/capture-acv` (exige o cabeçalho `x-api-key` com o valor de `CALC_API_KEY`) |

`POST /capture-acv-coeficientes` não é exposto através do Nginx.

## Documentação Interativa (Swagger)

O LCA Bridge expõe uma interface **Swagger/OpenAPI** com o esquema de entrada de ambos os endpoints e a possibilidade de executar pedidos de teste. A especificação em JSON está em `/openapi.json`.

| Ambiente | URL |
|---|---|
| Desenvolvimento local | `http://localhost:3000/docs` |
| Produção (Docker) | Não acessível a partir do exterior: a porta 3000 não é publicada e o cálculo só é exposto em `/calc` |

Para testar o serviço, pode usar-se como corpo o ficheiro `examples/example_in.json` do [repositório do LCA Bridge](https://github.com/quercus-uex/LCA-Bridge/blob/main/examples/example_in.json).
