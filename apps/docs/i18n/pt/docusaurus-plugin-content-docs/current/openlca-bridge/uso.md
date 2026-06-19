---
sidebar_label: 'Utilização'
sidebar_position: 3
---

# Utilização do Serviço

## Endpoint

O serviço expõe um único endpoint, `POST /capture-acv`, que recebe como corpo o JSON de saída de uma cultura do serviço DTAgro, executa o cálculo de ACV em openLCA e envia o resultado para o ACV Compare para persistência.

O processamento interno segue o seguinte fluxo:

1. **`validate_parcela()`** — Valida os metadados da parcela (SIGPAC, referência cadastral ou predial).
2. **`get_process_class()`** — Seleciona a classe de processo de acordo com o tipo de cultura: `TomateProcess`, `OlivoProcess` ou `VinedoProcess`.
3. **`update_processes()`** — Atualiza os processos em openLCA através do cliente IPC (`OLCAClient`).
4. **`calculate_impacts()`** — Executa o cálculo de impacto usando o UUID do sistema de produto como referência.
5. **`build_final_result()`** — Constrói o resultado estruturado a partir da saída do openLCA.
6. **`send_result_to_app()`** — Envia o resultado para o ACV Compare através de um POST (best-effort; os erros são registados no log sem interromper a resposta).

## Parâmetros de Cálculo

Ambos os parâmetros são configuráveis através de variáveis de ambiente no `.env` do serviço.

| Parâmetro | Valor por defeito | Descrição |
|---|---|---|
| `IMPACT_METHOD_UUID` | `20629e27-b863-4fbe-bbc2-082d3eefd1e5` | UUID do método de impacto selecionado para o cálculo. Por defeito é utilizado **EF 3.1** (Environmental Footprint 3.1), o método recomendado pela Comissão Europeia. |
| `CALCULATION_AMOUNT` | `0.001` | Quantidade do processo usada como referência. Os processos na base de dados estão definidos para 1 tonelada (1000 kg), pelo que um valor de `0.001` calcula o impacto correspondente a 1 kg de produção. |

## Integração com ACV Compare

Quando **ACV Compare** está implantado na mesma rede Docker (`olca`), o resultado do cálculo é transmitido automaticamente para o endpoint `POST /capture` do ACV Compare através da variável de ambiente `ACV_COMPARE_BASE_URL`.

Por sua vez, o frontend do ACV Compare encaminha os pedidos de cálculo através do proxy inverso Nginx:

| Rota | Destino |
|---|---|
| `/calc` | `capture-openlca-bridge:3000/capture-acv` |

## Resposta do Serviço

Após executar o cálculo de ACV em openLCA, o serviço devolve um JSON com os metadados originais da cultura e o resultado discriminado em cinco categorias de impacto. Cada categoria contém um array de objetos com a categoria ambiental (`category`), a magnitude (`amount`) e a unidade de medida (`unit`).

```json
{
    "metadatos": {
        "parcela": {
            "id": 3,
            "es_sigpac": { "provincia": 6, "municipio": 5, "poligono": 1, "parcela": 1 },
            "es_referencia_catastral": null,
            "pt_id_parcela_predial": null,
            "nombre": "Prueba"
        },
        "cultivo": {
            "id": 1,
            "tipo": "Tomate",
            "superficie_cultivada": 100,
            "produccion": 100,
            "consumo_agua": 500,
            "fecha_inicio_campania": 20240401,
            "fecha_fin_campania": 20241120,
            "ciclo": 200
        },
        "usuario": {
            "id": 3,
            "nombre": "Prueba",
            "email": "prueba@example.com"
        }
    },
    "resultado": {
        "impacto_fertilizantes": [
            { "category": "Climate change", "amount": 0.312, "unit": "kg CO2 eq" },
            { "category": "Acidification", "amount": 0.004, "unit": "mol H+ eq" },
            { "category": "Eutrophication, freshwater", "amount": 0.001, "unit": "kg P eq" }
        ],
        "impacto_manejo_cultivo": [
            { "category": "Climate change", "amount": 0.185, "unit": "kg CO2 eq" },
            { "category": "Ozone depletion", "amount": 0.000002, "unit": "kg CFC-11 eq" },
            { "category": "Land use", "amount": 12.45, "unit": "No dimension" }
        ],
        "impacto_pesticidas": [
            { "category": "Ecotoxicity, freshwater", "amount": 45.2, "unit": "CTUe" },
            { "category": "Human toxicity, cancer", "amount": 0.0003, "unit": "CTUh" }
        ],
        "impacto_sistema_riego": [
            { "category": "Climate change", "amount": 0.078, "unit": "kg CO2 eq" },
            { "category": "Resource use, minerals and metals", "amount": 0.005, "unit": "kg Sb eq" },
            { "category": "Water use", "amount": 0.52, "unit": "m3 world eq" }
        ],
        "impacto_total": [
            { "category": "Climate change", "amount": 0.575, "unit": "kg CO2 eq" },
            { "category": "Acidification", "amount": 0.004, "unit": "mol H+ eq" },
            { "category": "Eutrophication, freshwater", "amount": 0.001, "unit": "kg P eq" },
            { "category": "Ecotoxicity, freshwater", "amount": 45.2, "unit": "CTUe" },
            { "category": "Water use", "amount": 0.52, "unit": "m3 world eq" }
        ]
    }
}
```

As cinco categorias de impacto são:

| Categoria | Descrição |
|---|---|
| `impacto_fertilizantes` | Impacto derivado do fabrico e aplicação de fertilizantes, incluindo emissões de NH₃, N₂O, NO₃ e NOₓ. |
| `impacto_manejo_cultivo` | Impacto das operações agrícolas (lavoura, sementeira, colheita), ocupação do solo e uso de água. |
| `impacto_pesticidas` | Impacto dos produtos fitossanitários aplicados, classificados segundo SimaPro. |
| `impacto_sistema_riego` | Impacto dos materiais do sistema de rega (tubagens, gotejadores, bomba) e do consumo de água e energia. |
| `impacto_total` | Soma agregada de todas as categorias anteriores. |

Este mesmo JSON é enviado para o endpoint `POST /capture` do **ACV Compare** para persistência e visualização.

## Documentação Interativa (Swagger)

Capture ACV expõe uma interface **Swagger/OpenAPI** que permite explorar e testar o endpoint `POST /capture-acv` diretamente a partir do navegador. A documentação inclui o esquema do JSON de entrada, os códigos de resposta e a possibilidade de executar pedidos de teste.

| Ambiente | URL |
|---|---|
| Desenvolvimento local | `http://localhost:3000/docs` |
| Produção (Docker) | `http://<host-do-servidor>:3000/docs` |

:::tip
A especificação OpenAPI em formato JSON também está disponível em `/openapi.json`, útil para gerar clientes automaticamente ou importar em ferramentas como Postman ou Insomnia.
:::

## Testar o Serviço

Pode testar o correto funcionamento do serviço através da interface Swagger descrita acima.

Para ver a estrutura completa do JSON de entrada com todos os seus campos documentados, consulte a página [JSON de entrada](./json-entrada.md). Abaixo é apresentado um exemplo mínimo com os campos essenciais:

```json
{
    "metadatos": {
        "parcela": {
            "id": 3,
            "es_sigpac": { "provincia": 6, "municipio": 5, "poligono": 1, "parcela": 1 },
            "es_referencia_catastral": null,
            "pt_id_parcela_predial": null,
            "nombre": "Prueba"
        },
        "cultivo": {
            "id": 1,
            "tipo": "Tomate",
            "superficie_cultivada": 100,
            "produccion": 100,
            "consumo_agua": 500,
            "fecha_inicio_campania": 20240401,
            "fecha_fin_campania": 20241120,
            "ciclo": 200
        },
        "usuario": {
            "id": 3,
            "nombre": "Prueba",
            "email": "prueba@example.com"
        }
    },
    "riegos": { "tipo": "Sistema de riego horticola" },
    "bombeo": { "cabeas": 9, "potencia": 3, "consumo_l_h": 2 },
    "fitosanitarios": {
        "detalle": [{ "nombre": "Amectoctradin", "clasificacion_simapro": 1, "cantidad_total_produccion": 0.0048 }],
        "agrupado_por_clasificacion": []
    },
    "fertilizantes": { "kg_N": 0.1, "kg_K2O": 0.252, "kg_P2O5": 0.9389 },
    "manejo_cultivo": {
        "labores": [{ "labor_simapro": "Tillage, cultivating, chiselling [CH]", "UF_1_ha_produccion": 0.018 }],
        "ocupacion_suelo": 0.005,
        "uso_de_agua": 5
    },
    "maquinaria": {
        "cosecha_mecanizada": [],
        "maquinas": [{ "id": 6, "nombre": "John Deere 6M 180", "peso": 8500, "vida_h": 14000 }]
    }
}
```
