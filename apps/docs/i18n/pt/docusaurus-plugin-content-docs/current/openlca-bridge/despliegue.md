---
sidebar_label: 'Implantação'
sidebar_position: 2
---

# Implantação do Serviço

Em produção, o LCA Bridge e o [servidor IPC do openLCA](https://github.com/GreenDelta/olca-ipc-container) são implantados juntamente com o LCA-Compare através do compose da plataforma (`deploy/compose.yaml` do repositório [LCA-Compare](https://github.com/quercus-uex/LCA-Compare)), usando as imagens `ghcr.io/quercus-uex/lca-bridge` e `ghcr.io/quercus-uex/openlca-ipc`. Os passos gerais (preparação do servidor, `.env`, arranque e atualização) estão em [Implantação do ACV Compare](../acv-compare/despliegue.md).

## Pré-requisitos

- A base de dados do openLCA com os processos necessários já definidos. Não está incluída na imagem por motivos de licença.
- O `.env` da plataforma com `OLCA_DATA_DIR` a apontar para o diretório que contém essa base de dados.

## Dados do openLCA

O servidor IPC do openLCA utiliza a base de dados para executar os cálculos de impacto ambiental. O diretório `OLCA_DATA_DIR` do servidor é montado no contentor `openlca-ipc` como `/app/data`, e o serviço arranca com `-db ecoinvent`, pelo que a base de dados deve estar em `<OLCA_DATA_DIR>/databases/ecoinvent`. Em seguida é mostrada a estrutura do volume:

<p align="center">
    <img src="/img/openlca-bridge/volumen-olca-ipc.png" alt="Gráfico do volume openLCA" width="400"/>
</p>

:::note
O subdiretório `openlca-docker/` é um projeto **Maven/Java** independente que constrói a imagem do contentor do servidor IPC do openLCA. Não tem relação com o código Python do serviço ponte.
:::

## Variáveis de Ambiente

O serviço lê a sua configuração das seguintes variáveis de ambiente (também de um ficheiro `.env` na raiz do repositório). Em produção, `deploy/compose.yaml` define as três primeiras e as restantes usam o valor por defeito:

| Variável | Valor por defeito | Valor em produção | Descrição |
|---|---|---|---|
| `OLCA_HOST` | `localhost` | `http://openlca-ipc` | Host do servidor IPC do openLCA, com ou sem esquema (`localhost` ou `http://localhost`) |
| `OLCA_PORT` | `8080` | `8080` | Porta do servidor IPC do openLCA |
| `LCA_COMPARE_BASE_URL` | `http://127.0.0.1:8000` | `http://lca-compare-backend:3000` | URL base do LCA-Compare para envio dos resultados |
| `IMPACT_METHOD_UUID` | `20629e27-b863-4fbe-bbc2-082d3eefd1e5` | *(por defeito)* | UUID do método de impacto no openLCA (EF 3.1) |
| `CALCULATION_AMOUNT` | `1` | *(por defeito)* | Quantidade de produto, em kg, para a qual se calculam os impactos: com `1`, os resultados são por kg |

## Rede e Acesso

O LCA Bridge, o servidor IPC e o LCA-Compare partilham a rede do projeto (`lca-platform_default`) e comunicam pelo nome do serviço. Nem o LCA Bridge nem o `openlca-ipc` publicam portas: a partir do exterior, o cálculo só é acessível através da rota `/calc` do frontend do LCA-Compare, que exige o cabeçalho `x-api-key`.

## Publicação e Atualização

O workflow `.github/workflows/build.yml` do repositório do LCA Bridge publica as imagens `lca-bridge` e `openlca-ipc` em cada push para `main` (ou ao lançá-lo manualmente), com as etiquetas `main` e `sha-<hash>`. Depois de publicadas, atualize apenas estes serviços no servidor:

```bash
cd ~/lca-platform
docker compose pull lca-bridge openlca-ipc
docker compose up -d lca-bridge openlca-ipc
```

:::warning
A variável `TAG` de `deploy/compose.yaml` aplica-se a todas as imagens, incluindo `lca-bridge` e `openlca-ipc`. O LCA Bridge só publica a etiqueta `main` e as `sha-<hash>` dos seus próprios commits, pelo que fixar `TAG` numa versão do LCA-Compare (`X.Y.Z`) ou num `sha-<hash>` do LCA-Compare faz falhar o `pull` das imagens do LCA Bridge.
:::

## Execução Local com Docker Compose

O `docker-compose.yml` do repositório do LCA Bridge serve para levantar o serviço localmente construindo as imagens. A base de dados deve estar em `openlca-docker/data/databases/ecoinvent`:

```bash
docker compose up -d
```

O serviço ponte fica na porta **3000** e o servidor IPC na **3333**. Os resultados são enviados para `http://host.docker.internal:8000` (o backend do LCA-Compare em desenvolvimento), salvo se for definida `LCA_COMPARE_BASE_URL`.

## Verificação

Em produção, a partir do exterior do servidor e da raiz do repositório do LCA Bridge:

```bash
# Sem chave de API (deve devolver 401)
curl -i -X POST http://<servidor>/calc

# Cálculo com o exemplo de entrada do repositório do LCA Bridge
curl -X POST http://<servidor>/calc \
  -H "x-api-key: <CALC_API_KEY>" \
  -H "Content-Type: application/json" \
  -d @examples/example_in.json
```

Localmente:

```bash
# Documentação Swagger
curl http://localhost:3000/docs

# Endpoints de cálculo
curl -X POST http://localhost:3000/capture-acv \
  -H "Content-Type: application/json" \
  -d @examples/example_in.json

curl -X POST http://localhost:3000/capture-acv-coeficientes \
  -H "Content-Type: application/json" \
  -d @examples/example_in.json
```
