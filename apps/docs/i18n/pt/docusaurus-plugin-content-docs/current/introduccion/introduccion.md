---
sidebar_label: 'Introdução'
sidebar_position: 1
---

# Introdução

O sistema é composto por dois serviços independentes que trabalham de forma coordenada para oferecer uma solução completa de cálculo, visualização e comparação da **Avaliação do Ciclo de Vida (ACV)** de culturas agrícolas.

## Serviços

### Capture ACV

**Capture ACV** é um microsserviço desenvolvido em **Python** com **FastAPI** que atua como ponte entre a plataforma **DTAgro** e o motor de cálculo de ACV **openLCA**, com base de dados em formato **.zolca**. A sua responsabilidade é receber os dados agronómicos de uma cultura (parcela, tipo de cultura, insumos, rega, maquinaria, etc.), executar o cálculo de impacto ambiental delegando no servidor IPC do openLCA e enviar o resultado estruturado para o ACV Compare.

O serviço expõe um único endpoint, `POST /capture-acv`, e seleciona automaticamente o processo de cálculo adequado de acordo com o tipo de cultura (`TomateProcess`, `OlivoProcess` ou `VinedoProcess`).

### ACV Compare

**ACV Compare** é uma aplicação web formada por um **backend NestJS** e um **frontend React** responsável pela persistência, visualização e comparação dos resultados de ACV gerados pelo Capture ACV. Entre as suas funcionalidades destacam-se:

- Gestão de parcelas com integração de **SIGPAC**, **Catastro** e identificador predial português para representação geoespacial.
- Visualização de resultados de ACV discriminados por categoria de impacto (fertilizantes, maneio da cultura, pesticidas, sistema de rega e impacto total).
- Comparador entre dois conjuntos de culturas com filtros por localização, tipo de cultura, campanha e outros critérios.
- Dashboard de estatísticas globais com KPIs, evolução temporal, rankings territoriais e distribuição por culturas.
- Geração de relatórios em PDF com resumo e recomendações assistidas por **IA** (OpenRouter).
- Painel de administração para utilizadores, parcelas, culturas, métodos de impacto e dados territoriais, com autenticação JWT.

## Como Interagem

Ambos os serviços comunicam através de uma **rede Docker partilhada** (`olca`), o que permite um fluxo de dados desacoplado:

1. **DTAgro** envia os dados de uma cultura para o endpoint `POST /capture-acv` do **Capture ACV**.
2. **Capture ACV** executa o cálculo de impacto ambiental em **openLCA** e constrói o resultado estruturado.
3. O resultado é enviado através de um `POST /capture` para o backend do **ACV Compare**, que o persiste na base de dados PostgreSQL associando-o ao utilizador, parcela e cultura correspondentes.
4. O utilizador pode consultar os resultados, compará-los com outras culturas e gerar relatórios a partir da interface web do **ACV Compare**.

O envio de resultados do Capture ACV para o ACV Compare é realizado em modo *best-effort*: se o ACV Compare não estiver disponível, o erro é registado no log sem interromper a resposta ao cliente.

## Diagrama da Arquitetura de Software

<p align="center">
    <img src="/img/arquitectura-general.png" alt="Diagrama de arquitetura de software" width="700"/>
</p>
