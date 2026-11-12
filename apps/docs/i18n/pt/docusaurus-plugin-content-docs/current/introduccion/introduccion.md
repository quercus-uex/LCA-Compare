---
sidebar_label: 'Introdução'
sidebar_position: 1
---

# Introdução

A plataforma calcula, visualiza e compara a **Avaliação do Ciclo de Vida (ACV)** de culturas agrícolas através de três serviços independentes.

## Serviços

### LCA Capture

**LCA Capture** é a plataforma que regista os dados agronómicos das culturas. A sua API disponibiliza os dados dos sensores associados ao cálculo de ACV (**caudalímetro**, **fertilizante** e **trator**), com autenticação JWT e filtros por intervalo de datas.

### LCA Bridge

**LCA Bridge** é um microsserviço em **Python** com **FastAPI** que recebe os dados de uma cultura (parcela, insumos, rega, maquinaria…), calcula o seu impacto ambiental com o [servidor IPC do openLCA](https://github.com/GreenDelta/olca-ipc-container) segundo o processo do seu tipo de cultura (tomate, oliveira ou vinha) e envia o resultado para o LCA Compare.

### LCA Compare

**LCA Compare** é uma aplicação web (backend NestJS e frontend React) que guarda os resultados de ACV e permite consultá-los por parcela e campanha, compará-los entre conjuntos de culturas, gerar relatórios em PDF e analisá-los em estatísticas globais ou dentro de uma organização. Ver [Introdução ao LCA Compare](../acv-compare/introduccion.md).

## Como Interagem

O LCA Bridge, o servidor IPC do openLCA e o LCA Compare são implantados com o mesmo Docker Compose e comunicam através da sua rede interna:

1. Os dados de uma cultura chegam ao **LCA Bridge** através de `POST /calc`, a única rota do LCA Bridge exposta ao exterior (protegida com chave de API).
2. O **LCA Bridge** calcula o impacto ambiental no **openLCA** e constrói o resultado estruturado.
3. O LCA Bridge envia o resultado para o endpoint `POST /capture` do **LCA Compare**, que o guarda em PostgreSQL associado ao utilizador, à parcela e à cultura, e cria o utilizador e a parcela se não existirem.
4. O utilizador consulta os resultados, compara-os e gera relatórios a partir da interface web do **LCA Compare**.

O envio para o LCA Compare é *best-effort*: se o LCA Compare não estiver disponível, o LCA Bridge regista o erro no seu log e responde na mesma ao cliente com o resultado.

## Diagrama da Arquitetura de Software

<p align="center">
    <img src="/img/arquitectura-general.png" alt="Diagrama de arquitetura de software" width="700"/>
</p>
