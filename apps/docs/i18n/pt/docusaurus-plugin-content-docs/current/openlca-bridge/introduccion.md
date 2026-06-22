---
sidebar_label: 'Introdução'
sidebar_position: 1
---

# Introdução

**LCA Bridge** é um microsserviço **Python 3.12+** com **FastAPI** que atua como ponte entre a plataforma **LCA Capture** e o motor de cálculo de Avaliação do Ciclo de Vida **openLCA**, com base de dados em formato **.zolca**. Recebe os dados de uma cultura a partir do LCA Capture, executa o cálculo de impacto ambiental em openLCA através do seu servidor IPC e envia o resultado para [LCA Compare](https://github.com/quercus-uex/Ventum-ACV-Visualizer) para visualização e comparação.

A comunicação entre ambos os serviços realiza-se através de uma rede Docker partilhada (`olca`), o que permite orquestrar todo o fluxo de cálculo e visualização de ACV de forma desacoplada.

## Fluxo de Processamento

```
POST /capture-acv    →    ACVService.execute()
                         ├── validate_parcela()
                         ├── get_process_class()  →  TomateProcess | OlivoProcess | VinedoProcess
                         ├── update_processes()   →  OLCAClient (olca-ipc)
                         ├── calculate_impacts()  →  usa process.uuid (UUID do sistema de produto)
                         ├── build_final_result()
                          └── send_result_to_app() →  POST para LCA Compare (best-effort, erros registados)
```

- **`IMPACT_METHOD_UUID`**: UUID do método de impacto selecionado para o cálculo. Por defeito é utilizado **EF 3.1** (Environmental Footprint 3.1), o método recomendado pela Comissão Europeia para a avaliação de impacto ambiental de produtos. É configurável através de variável de ambiente.
- **`CALCULATION_AMOUNT`**: quantidade do processo usada como referência no cálculo de ACV. O valor por defeito é `0.001` porque os processos na base de dados estão definidos para 1 tonelada (1000 kg), pelo que com `0.001` se calcula o impacto de 1 kg de produção. É configurável através de variável de ambiente.

## Funcionalidades

- **Receção de dados de cultura** a partir do LCA Capture através do endpoint `POST /capture-acv`.
- **Cálculo de ACV** delegado no servidor IPC do openLCA com os processos definidos na base de dados .zolca.
- **Processos específicos por tipo de cultura**: `TomateProcess`, `OlivoProcess` e `VinedoProcess`, selecionados automaticamente de acordo com os metadados da cultura.
- **Envio de resultados** para o LCA Compare para persistência, visualização e comparação (best-effort).
- **Documentação Swagger** interativa na rota `/docs`.

## Variáveis de Ambiente

| Variável | Descrição |
|---|---|
| `OLCA_HOST` | Host do servidor IPC do OpenLCA |
| `OLCA_PORT` | Porta do servidor IPC do OpenLCA |
| `ACV_COMPARE_BASE_URL` | URL base do serviço LCA Compare para envio de resultados |
| `IMPACT_METHOD_UUID` | UUID do método de impacto para o cálculo (por defeito, EF 3.1) |
| `CALCULATION_AMOUNT` | Quantidade do processo usada como referência no cálculo (por defeito `0.001`, equivalente a 1 kg) |

## Arquitetura

O serviço segue uma arquitetura de microsserviço com dois componentes:

| Componente | Tecnologia | Porta |
|---|---|---|
| **LCA Bridge** | FastAPI (Python 3.12+) | 3000 |
| **OpenLCA IPC** | Java (Maven, `openlca-docker/`) | *(interno)* |

O fluxo de dados é: LCA Capture → LCA Bridge (cálculo) → LCA Compare (persistência e visualização).

## Stack Tecnológico

- **Python 3.12+** com **FastAPI** como framework REST
- **openLCA** como motor de cálculo de ACV (servidor IPC Java)
- **Base de dados .zolca** para processos de impacto ambiental
- **Docker** para implantação e orquestração de serviços
- **Swagger/OpenAPI** para documentação da API
- **tox + pytest** para testes com cobertura
