---
sidebar_label: 'Uso'
sidebar_position: 3
---

# Uso del servicio

El servicio expone un único *endpoint*, `POST /ventum-acv`, que recibirá como body el JSON de salida de un cultivo del
servicio de Ventum ACV. Puedes probar su correcto funcionamiento con el siguiente JSON de prueba:

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
                "UF_1_ha_produccion": 0.0052499999999999995,
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
            },
            {
                "labor_simapro": "Tillage, cultivating, chiselling [CH]",
                "rendimiento_h_ha": 1.5,
                "UF_1_ha": 1.7999999999999998,
                "UF_1_ha_produccion": 0.018,
                "fabricacion": 0.375,
                "reparacion": 0.16875,
                "UF_1_kg": 0.54375,
                "UF_1_kg_produccion": 0.0054375,
                "pases": [
                    {
                        "id_pase_apero": null,
                        "apero_id": 7,
                        "apero_nombre": "Chisel",
                        "maquina_id": 7,
                        "maquina_nombre": "New Holland T4 55S",
                        "pases": 1,
                        "tiempo_m_labor": 1.5,
                        "rendimiento_h_ha": 1.5,
                        "UF_1_ha": 1.7999999999999998,
                        "UF_1_ha_produccion": 0.018,
                        "fabricacion": 0.375,
                        "reparacion": 0.16875,
                        "UF_1_kg": 0.54375,
                        "UF_1_kg_produccion": 0.0054375
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

Puedes probar el correcto funcionamiento del servicio a través de la interfaz **Swagger** habilitada (`/docs`).