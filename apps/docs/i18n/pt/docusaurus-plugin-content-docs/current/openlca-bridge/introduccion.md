---
sidebar_label: 'Introdução'
sidebar_position: 1
---

# Introdução

**LCA Bridge** é um microsserviço **Python 3.12** com **FastAPI** que atua como ponte entre a plataforma **LCA Capture** e o motor de cálculo de Avaliação do Ciclo de Vida **openLCA**. Recebe os dados de uma cultura exportados pelo LCA Capture, calcula o seu impacto ambiental em openLCA através do [servidor IPC do openLCA](https://github.com/GreenDelta/olca-ipc-container) e envia o resultado para o [LCA-Compare](https://github.com/quercus-uex/LCA-Compare) para visualização e comparação.

O LCA Bridge, o servidor IPC do openLCA e o LCA-Compare são implantados no mesmo Docker Compose (`deploy/compose.yaml`) e comunicam através da sua rede interna. O fluxo de dados é: LCA Capture → LCA Bridge (cálculo) → LCA-Compare (persistência e visualização).

## Funcionalidades

- **Cálculo de ACV** de uma cultura através de dois endpoints com a mesma entrada e saída: `POST /capture-acv` (escreve os fluxos em openLCA e calcula) e `POST /capture-acv-coeficientes` (calcula com coeficientes em memória, sem escrever em openLCA). O fluxo de processamento é descrito em [Utilização](./uso.md).
- **Processos por tipo de cultura**: `TomateProcess`, `OlivoProcess` e `VinedoProcess`, selecionados de acordo com `metadatos.cultivo.tipo` (ver [Definição de processos](./procesos.md)).
- **Método de impacto EF 3.1** (Environmental Footprint 3.1); os resultados são expressos por kg de produto.
- **Envio de resultados** para o LCA-Compare (best-effort: uma falha no envio é registada no log e não afeta a resposta).
- **Documentação Swagger** na rota `/docs`.

A configuração (variáveis de ambiente) é detalhada em [Implantação](./despliegue.md#variáveis-de-ambiente).

## Arquitetura

| Componente | Tecnologia | Porta |
|---|---|---|
| **LCA Bridge** | FastAPI (Python 3.12) | 3000 |
| **openLCA IPC** | Java 21 (Maven, `openlca-docker/`) | 8080 *(interno)* |

## Stack Tecnológico

- **Python 3.12** com **FastAPI**; dependências geridas com **uv** (`pyproject.toml` + `uv.lock`)
- **openLCA** como motor de cálculo de ACV (servidor IPC Java) com a base de dados de processos montada como volume
- **Docker** para implantação
- **pytest** (com cobertura) para testes
