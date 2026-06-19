---
sidebar_label: 'JSON de entrada'
sidebar_position: 4
---

# JSON de Entrada do Endpoint `POST /capture-acv`

O endpoint `POST /capture-acv` recebe como corpo do pedido o JSON de saída de uma cultura gerado pelo serviço **DTAgro**. A seguir descreve-se a estrutura completa do documento.

## Estrutura Geral

O JSON é composto por sete blocos principais:

| Bloco | Descrição |
|---|---|
| `metadatos` | Informação da parcela, da cultura e do utilizador. |
| `riegos` | Parâmetros do sistema de rega instalado. |
| `bombeo` | Dados do equipamento de bombagem hidráulica. |
| `fitosanitarios` | Produtos fitossanitários aplicados, com detalhe e agrupamento por classificação SimaPro. |
| `fertilizantes` | Quantidades de nutrientes e emissões associadas à fertilização. |
| `manejo_cultivo` | Operações agrícolas realizadas, ocupação do solo e uso de água. |
| `maquinaria` | Maquinaria utilizada, incluindo colheita mecanizada. |

---

## `metadatos`

Contém os dados identificativos da parcela, da cultura e do utilizador que realiza o pedido.

### `metadatos.parcela`

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | `integer` | Sim | Identificador interno da parcela no DTAgro. |
| `es_sigpac` | `object` \| `null` | Condicional | Dados SIGPAC da parcela. Obrigatório se a parcela estiver registada em SIGPAC. |
| `es_sigpac.provincia` | `integer` | Condicional | Código de província INE. |
| `es_sigpac.municipio` | `integer` | Condicional | Código de município INE. |
| `es_sigpac.poligono` | `integer` | Condicional | Número de polígono cadastral. |
| `es_sigpac.parcela` | `integer` | Condicional | Número de parcela cadastral. |
| `es_referencia_catastral` | `string` \| `null` | Condicional | Referência cadastral da parcela. Alternativa a SIGPAC. |
| `pt_id_parcela_predial` | `string` \| `null` | Condicional | Identificador de parcela predial (Portugal). Alternativa a SIGPAC e cadastro. |
| `nombre` | `string` | Sim | Nome descritivo da parcela. |

:::note
Pelo menos um dos três identificadores geográficos (`es_sigpac`, `es_referencia_catastral` ou `pt_id_parcela_predial`) deve estar presente. O serviço valida a parcela usando o primeiro que encontrar.
:::

### `metadatos.cultivo`

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | `integer` | Sim | Identificador interno da cultura no DTAgro. |
| `tipo` | `string` | Sim | Tipo de cultura. Valores suportados: `"Tomate"`, `"Olivo"`, `"Vinedo"`. Determina o processo de cálculo selecionado (`TomateProcess`, `OlivoProcess`, `VinedoProcess`). |
| `superficie_cultivada` | `number` | Sim | Superfície cultivada em hectares (ha). |
| `produccion` | `number` | Sim | Produção total em quilogramas (kg). |
| `consumo_agua` | `number` | Sim | Consumo de água em metros cúbicos (m³). |
| `fecha_inicio_campania` | `integer` | Sim | Data de início de campanha em formato `YYYYMMDD`. |
| `fecha_fin_campania` | `integer` | Sim | Data de fim de campanha em formato `YYYYMMDD`. |
| `ciclo` | `integer` | Sim | Duração do ciclo de cultura em dias. |

### `metadatos.usuario`

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | `integer` | Sim | Identificador interno do utilizador no DTAgro. |
| `nombre` | `string` | Sim | Nome do utilizador. |
| `email` | `string` | Sim | Endereço de email do utilizador. |

---

## `riegos`

Parâmetros técnicos do sistema de rega. Os campos variam conforme o tipo de rega instalado.

| Campo | Tipo | Descrição |
|---|---|---|
| `tipo` | `string` | Tipo de sistema de rega (ex.: `"Sistema de riego horticola"`). |
| `entre_arboles` | `number` | Distância entre árvores em metros. |
| `entre_calles` | `number` | Distância entre linhas em metros. |
| `n_goteros_arbol` | `number` | Número de gotejadores por árvore. |
| `n_arboles` | `number` | Número total de árvores. |
| `n_calles` | `number` | Número de linhas. |
| `m_portagotero` | `number` | Metros totais de tubagem porta-gotejadores. |
| `peso_portagoteros_16mm` | `number` | Peso dos porta-gotejadores de 16 mm em kg. |
| `n_enganches` | `number` | Número de engates. |
| `peso_enganches` | `number` | Peso total de engates em kg. |
| `metros_principal` | `number` | Metros de tubagem principal. |
| `peso_principal_32mm` | `number` | Peso da tubagem principal de 32 mm em kg. |
| `peso_llaves` | `number` | Peso das válvulas em kg. |
| `kg_PP` | `number` | Quilogramas totais de polipropileno (PP). |
| `peso_tira_pollo` | `number` | Peso da tira de pollo em kg. |
| `peso_principal_17mm` | `number` | Peso da tubagem principal de 17 mm em kg. |
| `deposito_abono` | `number` | Capacidade do depósito de adubo em litros. |
| `kg_PP_ha_anio` | `number` | kg de PP por hectare e ano. |
| `kg_PE_1_ha_anio` | `number` | kg de polietileno (tipo 1) por hectare e ano. |
| `kg_PE_2_ha_anio` | `number` | kg de polietileno (tipo 2) por hectare e ano. |
| `kg_PE_deposito_ha_anio` | `number` | kg de PE do depósito por hectare e ano. |
| `kg_PE_ha_anio` | `number` | kg totais de PE por hectare e ano. |
| `kg_PVC_ha_anio` | `number` | kg de PVC por hectare e ano. |
| `kg_PVC_produccion` | `number` | kg de PVC por kg de produção. |
| `kg_PP_produccion` | `number` | kg de PP por kg de produção. |
| `kg_PE_produccion` | `number` | kg de PE por kg de produção. |

---

## `bombeo`

Dados do equipamento de bombagem hidráulica associado ao sistema de rega.

| Campo | Tipo | Descrição |
|---|---|---|
| `cabeas` | `number` | Número de cabeças de bombagem. |
| `potencia` | `number` | Potência do equipamento em kW. |
| `consumo_l_h` | `number` | Consumo em litros por hora. |
| `kg_acero_ha_produccion` | `number` | kg de aço por hectare e kg de produção. |

---

## `fitosanitarios`

Produtos fitossanitários aplicados à cultura, com detalhe individual e agrupamento por classificação SimaPro.

### `fitosanitarios.detalle[]`

Array com cada produto fitossanitário aplicado.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `integer` | Identificador do produto. |
| `nombre` | `string` | Nome comercial do produto. |
| `clasificacion_simapro` | `integer` | Código de classificação SimaPro (determina o processo de impacto em openLCA). |
| `n_aplicaciones` | `integer` | Número de aplicações realizadas. |
| `densidad` | `number` | Densidade do produto em kg/L. |
| `porcentaje_ma` | `number` | Percentagem de matéria ativa declarada. |
| `porcentaje_ma_usado` | `number` | Percentagem de matéria ativa realmente usada. |
| `porcentaje_ma_personalizado` | `number` \| `null` | Percentagem personalizada pelo utilizador, se aplicável. |
| `max_l_ha` | `number` | Dose máxima em litros por hectare. |
| `cantidad_total_ha` | `number` | Quantidade total aplicada por hectare em litros. |
| `cantidad_total_produccion` | `number` | Quantidade total aplicada por kg de produção em litros. |

### `fitosanitarios.agrupado_por_clasificacion[]`

Array com os fitossanitários agrupados pela sua classificação SimaPro.

| Campo | Tipo | Descrição |
|---|---|---|
| `clasificacion_simapro` | `integer` | Código de classificação SimaPro do grupo. |
| `cantidad_total_produccion` | `number` | Quantidade total do grupo por kg de produção. |
| `fitosanitarios[]` | `array` | Lista de produtos dentro do grupo. |
| `fitosanitarios[].id` | `integer` | Identificador do produto. |
| `fitosanitarios[].nombre` | `string` | Nome do produto. |
| `fitosanitarios[].n_aplicaciones` | `integer` | Número de aplicações. |
| `fitosanitarios[].cantidad_total_ha` | `number` | Quantidade por hectare em litros. |
| `fitosanitarios[].cantidad_total_produccion` | `number` | Quantidade por kg de produção em litros. |

---

## `fertilizantes`

Quantidades de nutrientes aplicados e emissões associadas à fertilização.

| Campo | Tipo | Descrição |
|---|---|---|
| `kg_N` | `number` | kg de azoto (N) por kg de produção. |
| `kg_K2O` | `number` | kg de óxido de potássio (K₂O) por kg de produção. |
| `kg_P2O5` | `number` | kg de pentóxido de fósforo (P₂O₅) por kg de produção. |
| `kg_NH3` | `number` | kg de amoníaco (NH₃) emitidos por kg de produção. |
| `kg_N2O` | `number` | kg de óxido nitroso (N₂O) emitidos por kg de produção. |
| `kg_NOX` | `number` | kg de óxidos de azoto (NOₓ) emitidos por kg de produção. |
| `kg_NO3` | `number` | kg de nitrato (NO₃) lixiviados por kg de produção. |
| `transporte_fert_UF_1` | `number` | Fator de unidade de transporte de fertilizantes (UF₁). |

---

## `manejo_cultivo`

Operações agrícolas realizadas sobre a cultura, juntamente com dados de ocupação do solo e uso de água.

### `manejo_cultivo.labores[]`

Array com cada operação agrícola realizada.

| Campo | Tipo | Descrição |
|---|---|---|
| `labor_simapro` | `string` | Nome do processo SimaPro associado à operação. |
| `rendimiento_h_ha` | `number` | Rendimento em horas por hectare. |
| `UF_1_ha` | `number` | Fator de unidade 1 por hectare. |
| `UF_1_ha_produccion` | `number` | Fator de unidade 1 por hectare e kg de produção. |
| `fabricacion` | `number` | Impacto de fabrico da maquinaria. |
| `reparacion` | `number` | Impacto de reparação da maquinaria. |
| `UF_1_kg` | `number` | Fator de unidade 1 por kg de maquinaria. |
| `UF_1_kg_produccion` | `number` | Fator de unidade 1 por kg de maquinaria e kg de produção. |

#### `manejo_cultivo.labores[].pases[]`

Array com cada passagem da operação.

| Campo | Tipo | Descrição |
|---|---|---|
| `id_pase_apero` | `integer` \| `null` | Identificador da passagem do implemento. |
| `apero_id` | `integer` | Identificador do implemento. |
| `apero_nombre` | `string` | Nome do implemento. |
| `maquina_id` | `integer` | Identificador da máquina tratora. |
| `maquina_nombre` | `string` | Nome da máquina tratora. |
| `pases` | `integer` | Número de passagens realizadas. |
| `tiempo_m_labor` | `number` | Tempo em minutos de operação por passagem. |
| `rendimiento_h_ha` | `number` | Rendimento em horas por hectare. |
| `UF_1_ha` | `number` | Fator de unidade 1 por hectare. |
| `UF_1_ha_produccion` | `number` | Fator de unidade 1 por hectare e kg de produção. |
| `fabricacion` | `number` | Impacto de fabrico. |
| `reparacion` | `number` | Impacto de reparação. |
| `UF_1_kg` | `number` | Fator de unidade 1 por kg. |
| `UF_1_kg_produccion` | `number` | Fator de unidade 1 por kg e kg de produção. |

### Outros Campos de `manejo_cultivo`

| Campo | Tipo | Descrição |
|---|---|---|
| `ocupacion_suelo` | `number` | Fator de ocupação do solo (m²·ano por kg de produção). |
| `uso_de_agua` | `number` | Uso de água em m³ por kg de produção. |

---

## `maquinaria`

Maquinaria utilizada nas operações da cultura.

### `maquinaria.cosecha_mecanizada`

Array com os dados da colheita mecanizada, se aplicável. Pode estar vazio se a colheita for manual.

### `maquinaria.maquinas[]`

Array com cada máquina tratora utilizada.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `integer` | Identificador da máquina. |
| `nombre` | `string` | Nome ou modelo da máquina. |
| `peso` | `number` | Peso da máquina em kg. |
| `vida_h` | `number` | Vida útil da máquina em horas. |
| `rendimiento_h_ha` | `number` | Rendimento em horas por hectare. |
| `fabricacion_kg_ha` | `number` | kg de aço de fabrico por hectare. |
| `reparacion_kg_ha` | `number` | kg de aço de reparação por hectare. |
| `UF_kg_reciclaje` | `number` | Fator de unidade de reciclagem em kg. |
| `UF_kg_reciclaje_produccion` | `number` | Fator de unidade de reciclagem em kg por kg de produção. |

---

## Exemplo Completo

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
        "tipo": "Sistema de riego horticola",
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
