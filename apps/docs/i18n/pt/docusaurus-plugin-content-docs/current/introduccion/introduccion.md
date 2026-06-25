---
sidebar_label: 'Introdução'
sidebar_position: 1
---

# Introdução

O sistema é composto por três serviços independentes que trabalham de forma coordenada para oferecer uma solução completa de cálculo, visualização e comparação da **Avaliação do Ciclo de Vida (ACV)** de culturas agrícolas.

## Serviços

### LCA Capture

**LCA Capture** expõe uma API para obter os dados registados por diferentes sensores associados ao cálculo de ACV, incluindo **caudalímetro**, **fertilizante** e **trator**. Estes dados são consultados através de endpoints autenticados com JWT e podem ser filtrados por intervalos de datas.

### LCA Bridge

**LCA Bridge** é um microsserviço desenvolvido em **Python** com **FastAPI** que atua como ponte entre a plataforma **LCA Capture** e o motor de cálculo de ACV **openLCA**, com base de dados em formato **.zolca**. A sua responsabilidade é receber os dados agronómicos de uma cultura (parcela, tipo de cultura, insumos, rega, maquinaria, etc.), executar o cálculo de impacto ambiental delegando no [servidor IPC do OpenLCA](https://github.com/GreenDelta/olca-ipc-container) e enviar o resultado estruturado para o LCA Compare.

O serviço expõe um único endpoint, `POST /capture-acv`, e seleciona automaticamente o processo de cálculo adequado de acordo com o tipo de cultura (`TomateProcess`, `OlivoProcess` ou `VinedoProcess`).

### LCA Compare

**LCA Compare** é uma aplicação web formada por um **backend NestJS** e um **frontend React** responsável pela persistência, visualização e comparação dos resultados de ACV gerados pelo LCA Bridge. Entre as suas funcionalidades destacam-se:

- Gestão de parcelas com integração de **SIGPAC**, **Catastro** e identificador predial português para representação geoespacial.
- Visualização de resultados de ACV discriminados por categoria de impacto (fertilizantes, maneio da cultura, pesticidas, sistema de rega e impacto total).
- Comparador entre dois conjuntos de culturas com filtros por localização, tipo de cultura, campanha e outros critérios.
- Dashboard de estatísticas globais com KPIs, evolução temporal, rankings territoriais e distribuição por culturas.
- Geração de relatórios em PDF com resumo e recomendações assistidas por **IA** (OpenRouter).
- Painel de administração para utilizadores, parcelas, culturas, métodos de impacto e dados territoriais, com autenticação JWT.

## Como Interagem

**LCA Capture** é um serviço independente que inicia o fluxo enviando os dados da cultura para o **LCA Bridge**. A
comunicação interna entre **LCA Bridge**, **LCA Compare** e **openLCA** é realizada através de uma **rede Docker
partilhada** (`olca`), o que permite um fluxo de dados desacoplado:

1. **LCA Capture** envia os dados de uma cultura para o endpoint `POST /capture-acv` do **LCA Bridge**.
2. **LCA Bridge** executa o cálculo de impacto ambiental em **openLCA** e constrói o resultado estruturado.
3. O resultado é enviado através de um `POST /capture` para o backend do **LCA Compare**, que o persiste na base de dados PostgreSQL associando-o ao utilizador, parcela e cultura correspondentes.
4. O utilizador pode consultar os resultados, compará-los com outras culturas e gerar relatórios a partir da interface web do **LCA Compare**.

O envio de resultados do LCA Bridge para o LCA Compare é realizado em modo *best-effort*: se o LCA Compare não estiver disponível, o erro é registado no log sem interromper a resposta ao cliente.

## Diagrama da Arquitetura de Software

<p align="center">
    <img src="/img/arquitectura-general.png" alt="Diagrama de arquitetura de software" width="700"/>
</p>
