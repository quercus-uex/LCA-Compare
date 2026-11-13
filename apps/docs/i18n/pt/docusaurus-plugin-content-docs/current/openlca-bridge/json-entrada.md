---
sidebar_label: 'JSON de entrada'
sidebar_position: 4
---

# JSON de Entrada

Os endpoints `POST /capture-acv` e `POST /capture-acv-coeficientes` recebem como corpo do pedido o JSON de uma cultura exportado pelo LCA Capture. O modelo é gerado a partir do esquema `schema/lca_capture_schema_v1.json` do repositório do LCA Bridge e não admite campos não definidos. Um campo desconhecido, um campo obrigatório ausente ou um tipo incorreto devolvem HTTP 422.

Salvo indicação de outra unidade, as quantidades "por produção" (`*_produccion`, fertilizantes) são expressas **por tonelada de produto**, uma vez que `metadatos.cultivo.produccion` está em t/ha.

## Estrutura Geral

| Bloco | Obrigatório | Descrição |
|---|---|---|
| `metadatos` | Sim | Informação da parcela, da cultura e do utilizador. |
| `riegos` | Sim | Parâmetros do sistema de rega instalado. |
| `bombeo` | Não | Dados do equipamento de bombagem. Sem este bloco não são contabilizados a energia nem o aço da bomba. |
| `caseta` | Não | Casa de rega. |
| `espalderas` | Não | Espaldeira (olival e vinha). |
| `fitosanitarios` | Sim | Produtos fitofarmacêuticos aplicados, com detalhe e agrupamento por classificação SimaPro. |
| `fertilizantes` | Sim | Nutrientes aplicados e emissões da fertilização. |
| `manejo_cultivo` | Sim | Operações agrícolas, ocupação do solo e uso de água. |
| `maquinaria` | Sim | Maquinaria utilizada, incluindo a colheita mecanizada. |

Os critérios de cálculo de cada campo estão em [Cálculo dos processos](https://github.com/quercus-uex/LCA-Bridge/blob/main/docs/calculo_procesos.md).

---

## `metadatos`

### `metadatos.parcela`

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | `integer` | Sim | Identificador da parcela no LCA Capture. |
| `es_sigpac` | `object` \| `null` | Não | Código SIGPAC: `provincia`, `municipio`, `poligono` e `parcela` (`integer` \| `null`). |
| `es_referencia_catastral` | `string` \| `null` | Não | Referência cadastral. |
| `pt_id_parcela_predial` | `string` \| `null` | Não | Código de parcela predial (Portugal). |
| `nombre` | `string` | Sim | Nome da parcela. |

:::note
Deve ser indicado pelo menos um dos três identificadores (`es_sigpac` com `provincia`, `es_referencia_catastral` ou `pt_id_parcela_predial`); caso contrário, o serviço responde HTTP 400.
:::

### `metadatos.cultivo`

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | `integer` | Sim | Identificador da cultura no LCA Capture. |
| `tipo` | `string` | Sim | Tipo de cultura: `"Tomate"`, `"Olivo"` ou `"Viñedo"`. Determina o processo de cálculo; outro valor devolve HTTP 400. |
| `superficie_cultivada` | `number` | Sim | Superfície cultivada (ha). Deve ser maior que 0. |
| `produccion` | `number` | Sim | Produção (t/ha). Deve ser maior que 0. |
| `consumo_agua` | `number` \| `null` | Sim | Consumo de água (m³/ha). Com `null` não é contabilizada energia de bombagem. |
| `fecha_inicio_campania` | `integer` | Sim | Data de início da campanha (`AAAAMMDD`). |
| `fecha_fin_campania` | `integer` | Sim | Data de fim da campanha (`AAAAMMDD`). |
| `ciclo` | `integer` \| `null` | Sim | Duração do ciclo de cultura em dias. |

### `metadatos.usuario`

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | `integer` | Sim | Identificador do utilizador no LCA Capture. |
| `nombre` | `string` | Sim | Nome do utilizador. |
| `email` | `string` | Sim | Email (deve ser um endereço válido). |

---

## `riegos`

`tipo` determina o cálculo dos plásticos da rega: deve conter `"hortícola"` (fita gota-a-gota), `"integrados"` (árvores com gotejadores integrados) ou `"pinchados"` (árvores com gotejadores de inserção); outro valor devolve HTTP 400.

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `tipo` | `string` | Sim | Tipo de sistema de rega (p. ex. `"Sistema de riego hortícola"`). |
| `entre_arboles` | `number` | Sim | Distância entre árvores ou plantas (m). Com gotejadores de inserção deve ser maior que 0. |
| `entre_calles` | `number` | Sim | Distância entre entrelinhas ou linhas (m). Deve ser maior que 0. |
| `n_goteros_arbol` | `integer` \| `null` | Não | Número de gotejadores por árvore. |
| `n_arboles` | `number` | Sim | Número de árvores. |
| `n_calles` | `number` | Sim | Número de entrelinhas. |
| `m_portagotero` | `number` | Sim | Metros de tubagem porta-gotejadores. |
| `peso_portagoteros_16mm` | `number` | Sim | Peso dos porta-gotejadores de 16 mm (kg). |
| `n_enganches` | `number` | Sim | Número de engates. |
| `peso_enganches` | `number` | Sim | Peso dos engates (kg). |
| `metros_principal` | `integer` | Sim | Metros de tubagem principal. |
| `peso_principal_32mm` | `number` | Sim | Peso da tubagem principal de 32 mm (kg). |
| `peso_llaves` | `number` | Sim | Peso das válvulas (kg). |
| `kg_PP` | `number` | Sim | kg de polipropileno (PP). |
| `kg_PE` | `number` \| `null` | Não | kg de polietileno (PE). |
| `peso_tira_pollo` | `integer` \| `null` | Não | Peso da fita gota-a-gota (kg). |
| `peso_principal_17mm` | `number` \| `null` | Não | Peso da tubagem principal de 17 mm (kg). |
| `deposito_abono` | `number` \| `null` | Não | Peso do depósito de adubo (kg). |
| `kg_PP_ha_anio` | `number` | Sim | kg de PP por hectare e ano. |
| `kg_PE_1_ha_anio` | `number` \| `null` | Não | kg de PE (tipo 1) por hectare e ano. |
| `kg_PE_2_ha_anio` | `integer` \| `null` | Não | kg de PE (tipo 2) por hectare e ano. |
| `kg_PE_deposito_ha_anio` | `number` \| `null` | Não | kg de PE do depósito por hectare e ano. |
| `kg_PE_ha_anio` | `number` \| `null` | Não | kg de PE por hectare e ano. |
| `kg_PVC_ha_anio` | `number` \| `null` | Não | kg de PVC por hectare e ano. |
| `kg_PVC_produccion` | `number` \| `null` | Não | kg de PVC por tonelada. |
| `kg_PP_produccion` | `number` | Sim | kg de PP por tonelada. |
| `kg_PE_produccion` | `number` | Sim | kg de PE por tonelada. |

---

## `bombeo`

Bloco opcional. Se for incluído, todos os seus campos são obrigatórios.

| Campo | Tipo | Descrição |
|---|---|---|
| `cabeas` | `number` | Número de cabeças de bombagem. |
| `potencia` | `number` | Potência da bomba; determina o consumo elétrico de acordo com a tabela de grupos de bombagem. |
| `consumo_l_h` | `number` | Consumo de gasóleo (l/h) de uma bomba a diesel. |
| `kg_acero_ha_produccion` | `number` | kg de aço da bomba por tonelada. |

---

## `caseta`

Bloco opcional. O cálculo usa `largo` e `ancho` (m); sem eles, a casa de rega não é contabilizada.

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `largo`, `ancho` | `string` \| `null` | Não | Dimensões da casa de rega (m). |
| `alto`, `largo_tejado`, `ancho_tejado` | `string` \| `null` | Não | Dimensões da casa de rega e do telhado (m). |
| `superficie_tejado`, `kg_hormigon_m2`, `kg_hormigon`, `peso_m2_chapas_acero`, `kg_poliuretano`, `kg_acero` | `number` \| `null` | Não | Dados intermédios do LCA Capture. |
| `kg_hor` | `number` | Sim | kg de betão por tonelada. |
| `kg_PU` | `number` | Sim | kg de poliuretano por tonelada. |
| `kg_acero_ha_anio` | `number` | Sim | kg de aço por tonelada. |

---

## `espalderas`

Bloco opcional, calculado pelo LCA Capture com a folha ESPALDERAS do Excel de referência (pesos em kg por ha). Com `kg_acero_ha` igual a 0, a espaldeira não é contabilizada.

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `kg_acero_ha` | `number` | Sim | kg de aço da espaldeira por ha. |
| `kg_acero_ha_anio_produccion` | `number` | Sim | kg de aço por tonelada. |
| `peso_alambre_ha` | `number` \| `null` | Não | kg de arame por ha (espaldeira de olival). |
| `peso_alambre_formacion_ha`, `peso_alambre_vegetacion_ha` | `number` \| `null` | Não | kg de arame de formação e de vegetação por ha (espaldeira de vinha). |
| `tipo` | `integer` \| `null` | Não | Tipo de espaldeira. |

Os restantes campos (`entre_arboles`, `entre_calles`, `distancia_postes`, `postes_linea`, `peso_poste`, `lineas_ha`, `postes_ha`, `m_alambre_*`, `*gripple*`, `peso_postes_ha`, `kg_acero_ha_anio`) são dados intermédios opcionais.

---

## `fitosanitarios`

### `fitosanitarios.detalle[]`

Cada produto fitofarmacêutico aplicado. Todos os campos são obrigatórios, exceto `porcentaje_ma_personalizado`.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `integer` | Identificador do produto. |
| `nombre` | `string` | Nome comercial; é procurado na tabela de fitofármacos de referência. |
| `clasificacion_simapro` | `integer` | Código de classificação SimaPro. É usado se o produto não estiver na tabela de referência; se também não for reconhecido, o serviço responde HTTP 400. |
| `n_aplicaciones` | `integer` | Número de aplicações. |
| `densidad` | `number` | Densidade do produto (kg/l). |
| `porcentaje_ma` | `number` | Percentagem de substância ativa declarada. |
| `porcentaje_ma_usado` | `number` | Percentagem de substância ativa usada no cálculo. |
| `porcentaje_ma_personalizado` | `number` \| `null` | Percentagem personalizada pelo utilizador, se existir. |
| `max_l_ha` | `number` | Dose por aplicação (l/ha). |
| `cantidad_total_ha` | `number` | Quantidade total aplicada por hectare. |
| `cantidad_total_produccion` | `number` | Quantidade total aplicada por tonelada. |

### `fitosanitarios.agrupado_por_clasificacion[]`

Fitofármacos agrupados por classificação SimaPro. Todos os campos são obrigatórios.

| Campo | Tipo | Descrição |
|---|---|---|
| `clasificacion_simapro` | `integer` | Código de classificação SimaPro do grupo. |
| `cantidad_total_produccion` | `number` | Quantidade total do grupo por tonelada. |
| `fitosanitarios[]` | `array` | Produtos do grupo, com `id`, `nombre`, `n_aplicaciones`, `cantidad_total_ha` e `cantidad_total_produccion`. |

---

## `fertilizantes`

Todos os campos são obrigatórios.

| Campo | Tipo | Descrição |
|---|---|---|
| `kg_N` | `number` | kg de azoto (N) por tonelada. |
| `kg_K2O` | `number` | kg de óxido de potássio (K₂O) por tonelada. |
| `kg_P2O5` | `number` | kg de pentóxido de fósforo (P₂O₅) por tonelada. |
| `kg_NH3` | `number` | kg de amoníaco (NH₃) emitidos por tonelada. |
| `kg_N2O` | `number` | kg de óxido nitroso (N₂O) emitidos por tonelada. |
| `kg_NOX` | `number` | kg de óxidos de azoto (NOₓ) emitidos por tonelada. |
| `kg_NO3` | `number` | kg de nitrato (NO₃) lixiviados por tonelada. |
| `transporte_fert_UF_1` | `number` | Transporte dos fertilizantes (t·km por tonelada). |

---

## `manejo_cultivo`

### `manejo_cultivo.labores[]`

Cada operação agrícola realizada. Todos os campos são obrigatórios.

| Campo | Tipo | Descrição |
|---|---|---|
| `labor_simapro` | `string` | Nome do processo SimaPro associado à operação. |
| `rendimiento_h_ha` | `number` | Rendimento (h/ha). |
| `UF_1_ha` | `number` | Unidade funcional por hectare. |
| `UF_1_ha_produccion` | `number` | Unidade funcional por hectare e tonelada. |
| `fabricacion` | `number` | Fabrico da maquinaria. |
| `reparacion` | `number` | Reparação da maquinaria. |
| `UF_1_kg` | `number` | Unidade funcional por kg de maquinaria. |
| `UF_1_kg_produccion` | `number` | Unidade funcional por kg de maquinaria e tonelada. |
| `pases[]` | `array` | Passagens da operação (ver abaixo). |

#### `manejo_cultivo.labores[].pases[]`

Cada passagem de uma alfaia. O cálculo usa `apero_nombre`, `tiempo_m_labor` e `pases`.

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id_pase_apero` | `number` \| `null` | Não | Identificador da passagem da alfaia. |
| `apero_id` | `integer` | Sim | Identificador da alfaia. |
| `apero_nombre` | `string` | Sim | Nome da alfaia; uma alfaia desconhecida não é contabilizada. |
| `maquina_id` | `integer` \| `null` | Não | Identificador da máquina de tração. |
| `maquina_nombre` | `string` \| `null` | Não | Nome da máquina de tração. |
| `pases` | `integer` | Sim | Número de passagens. |
| `tiempo_m_labor` | `number` | Sim | Tempo da operação (h/ha). |
| `rendimiento_h_ha`, `UF_1_ha`, `UF_1_ha_produccion`, `fabricacion`, `reparacion`, `UF_1_kg`, `UF_1_kg_produccion` | `number` | Sim | Como em `labores[]`, para a passagem. |

### Outros Campos de `manejo_cultivo`

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `ocupacion_suelo` | `number` | Sim | Ocupação do solo por tonelada. |
| `uso_de_agua` | `number` | Sim | Uso de água por tonelada. |

---

## `maquinaria`

### `maquinaria.cosecha_mecanizada[]`

Máquinas de colheita utilizadas; vazio se a colheita não for mecanizada. Todos os campos são obrigatórios.

| Campo | Tipo | Descrição |
|---|---|---|
| `tipo` | `string` | Tipo de máquina de colheita: `"cosechadora_tomate"`, `"cosechadora_olivo"` ou `"cosechadora_vid"`. Só conta a da cultura calculada. |
| `UF_kg` | `number` | Gasóleo da máquina de colheita. |
| `UF_kg_produccion` | `number` | Gasóleo da máquina de colheita por tonelada (kg/t). |
| `UF_kg_fabricacion` | `number` | Fabrico da máquina de colheita. |
| `UF_kg_fabricacion_produccion` | `number` | Fabrico da máquina de colheita por tonelada (kg/t). |

### `maquinaria.maquinas[]`

Cada máquina de tração utilizada. Todos os campos são obrigatórios.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `integer` | Identificador da máquina. |
| `nombre` | `string` | Nome ou modelo. |
| `peso` | `integer` | Peso (kg). |
| `vida_h` | `integer` | Vida útil (h). |
| `rendimiento_h_ha` | `number` | Rendimento (h/ha). |
| `fabricacion_kg_ha` | `number` | kg de aço de fabrico por hectare. |
| `reparacion_kg_ha` | `number` | kg de aço de reparação por hectare. |
| `UF_kg_reciclaje` | `number` | kg de reciclagem. |
| `UF_kg_reciclaje_produccion` | `number` | kg de reciclagem por tonelada. |

---

## Exemplo Completo

O seguinte JSON corresponde a uma cultura de tomate exportada pelo LCA Capture, baseada em `examples/example_in.json` do [repositório do LCA Bridge](https://github.com/quercus-uex/LCA-Bridge/blob/main/examples/example_in.json).

```json
{
    "metadatos": {
        "parcela": {
            "id": 3,
            "es_sigpac": {
                "provincia": 6,
                "municipio": 5,
                "poligono": 1,
                "parcela": 1
            },
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
    "riegos": {
        "tipo": "Sistema de riego hortícola",
        "entre_arboles": 1.5,
        "entre_calles": 2.1,
        "n_goteros_arbol": 10,
        "n_arboles": 3174.6031746031745,
        "n_calles": 66.66666666666667,
        "m_portagotero": 6666.666666666667,
        "peso_portagoteros_16mm": 375.33333333333337,
        "n_enganches": 66.66666666666667,
        "peso_enganches": 0.78,
        "metros_principal": 100,
        "peso_principal_32mm": 21.07,
        "peso_llaves": 0.0208,
        "kg_PP": 10.1508,
        "peso_tira_pollo": 78,
        "peso_principal_17mm": 110.5,
        "deposito_abono": 5.5,
        "kg_PP_ha_anio": 1.26885,
        "kg_PE_1_ha_anio": 1.1,
        "kg_PE_2_ha_anio": 78,
        "kg_PE_deposito_ha_anio": 0.43333333333333335,
        "kg_PE_ha_anio": 79.53333333333333,
        "kg_PVC_ha_anio": 13.8125,
        "kg_PVC_produccion": 0.138125,
        "kg_PP_produccion": 0.0126885,
        "kg_PE_produccion": 0.7953333333333333
    },
    "bombeo": {
        "cabeas": 9,
        "potencia": 3,
        "consumo_l_h": 2,
        "kg_acero_ha_produccion": 0.0018
    },
    "fitosanitarios": {
        "detalle": [
            {
                "id": 7,
                "nombre": "Amectoctradin",
                "clasificacion_simapro": 1,
                "n_aplicaciones": 2,
                "densidad": 1.04,
                "porcentaje_ma": 20,
                "porcentaje_ma_usado": 20,
                "porcentaje_ma_personalizado": null,
                "max_l_ha": 1.2,
                "cantidad_total_ha": 0.48,
                "cantidad_total_produccion": 0.0048
            }
        ],
        "agrupado_por_clasificacion": [
            {
                "clasificacion_simapro": 1,
                "cantidad_total_produccion": 0.245,
                "fitosanitarios": [
                    {
                        "id": 7,
                        "nombre": "Amectoctradin",
                        "n_aplicaciones": 2,
                        "cantidad_total_ha": 0.48,
                        "cantidad_total_produccion": 0.0048
                    }
                ]
            }
        ]
    },
    "fertilizantes": {
        "kg_N": 0.1,
        "kg_K2O": 0.252,
        "kg_P2O5": 0.9389,
        "kg_NH3": 0.0016400000000000002,
        "kg_N2O": 0.0005,
        "kg_NOX": 0.004,
        "kg_NO3": 0.03,
        "transporte_fert_UF_1": 1.01
    },
    "manejo_cultivo": {
        "labores": [
            {
                "labor_simapro": "Application of plant protection product, by field sprayer [CH]",
                "rendimiento_h_ha": 0.75,
                "UF_1_ha": 0.5249999999999999,
                "UF_1_ha_produccion": 0.018,
                "fabricacion": 0.75,
                "reparacion": 0.3375,
                "UF_1_kg": 1.0875,
                "UF_1_kg_produccion": 0.010875,
                "pases": [
                    {
                        "id_pase_apero": null,
                        "apero_id": 4,
                        "apero_nombre": "Atomizador",
                        "maquina_id": 6,
                        "maquina_nombre": "John Deere 6M 180",
                        "pases": 1,
                        "tiempo_m_labor": 0.25,
                        "rendimiento_h_ha": 0.25,
                        "UF_1_ha": 0.175,
                        "UF_1_ha_produccion": 0.0017499999999999998,
                        "fabricacion": 0.25,
                        "reparacion": 0.1125,
                        "UF_1_kg": 0.3625,
                        "UF_1_kg_produccion": 0.0036249999999999998
                    }
                ]
            }
        ],
        "ocupacion_suelo": 0.005479452054794521,
        "uso_de_agua": 5
    },
    "maquinaria": {
        "cosecha_mecanizada": [],
        "maquinas": [
            {
                "id": 6,
                "nombre": "John Deere 6M 180",
                "peso": 8500,
                "vida_h": 14000,
                "rendimiento_h_ha": 0.75,
                "fabricacion_kg_ha": 0.45535714285714285,
                "reparacion_kg_ha": 0.09107142857142858,
                "UF_kg_reciclaje": 0.5464285714285715,
                "UF_kg_reciclaje_produccion": 0.005464285714285715
            }
        ]
    }
}
```
