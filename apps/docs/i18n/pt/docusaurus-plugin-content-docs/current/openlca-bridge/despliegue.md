---
sidebar_label: 'Implantação'
sidebar_position: 2
---

# Implantação do Serviço

## Pré-requisitos

Antes de implantar o serviço ponte entre DTAgro e OpenLCA, é necessário ter descarregado:

- o repositório ([https://github.com/quercus-uex/Ventum-OpenLCA-Service](https://github.com/quercus-uex/Ventum-OpenLCA-Service)) (Capture ACV).
- a base de dados em formato **.zolca** com os processos necessários já definidos.

## Configuração da Base de Dados .zolca

A base de dados do OpenLCA (ficheiro .zolca) deve existir na rota `openlca-docker/data/databases/bafu` antes de iniciar o serviço. Modifique o ficheiro `docker-compose.yml` para que o volume montado no serviço `openlca-ipc` aponte para a pasta que contém essa base de dados. Em seguida é mostrado um gráfico explicativo:

<p align="center">
    <img src="/img/openlca-bridge/volumen-olca-ipc.png" alt="Gráfico do volume OpenLCA" width="400"/>
</p>

:::note
O subdiretório `openlca-docker/` é um projeto **Maven/Java** independente que constrói a imagem do contentor do servidor IPC do OpenLCA. Não tem relação com o código Python do serviço ponte.
:::

## Variáveis de Ambiente

O serviço lê a sua configuração a partir de um ficheiro `.env` localizado na raiz do projeto. Como ponto de partida, copie o ficheiro `.env.example` incluído no repositório e renomeie-o para `.env`:

```bash
cp .env.example .env
```

Em seguida, ajuste os valores ao seu ambiente:

```sh
OLCA_HOST="openlca-ipc"              # Host do servidor IPC do OpenLCA
OLCA_PORT="8080"                     # Porta do servidor IPC do OpenLCA
ACV_COMPARE_BASE_URL="http://acv-compare-backend:3000"  # URL base do ACV Compare

IMPACT_METHOD_UUID="20629e27-b863-4fbe-bbc2-082d3eefd1e5"  # UUID do método de impacto (por defeito, EF 3.1)
CALCULATION_AMOUNT="0.001"           # Quantidade do processo para o cálculo (1000 kg → 0.001 = 1 kg)
```

:::note
O ficheiro `.env.example` contém todos os valores por defeito necessários para uma implantação padrão. Só é imprescindível modificar `ACV_COMPARE_BASE_URL` se a URL do ACV Compare diferir da configuração por defeito.
:::

## Rede Partilhada com ACV Compare

Caso queira comunicar este serviço com **ACV Compare**, é necessário criar a rede partilhada `olca`:

```bash
docker network create olca
```

Ambos os serviços devem estar ligados a esta rede para que o ACV Compare possa receber os resultados dos cálculos e o frontend possa encaminhar os pedidos de cálculo através do proxy inverso para o serviço ponte.

## Implantação com Docker Compose

Depois de configurada a base de dados e criada a rede `olca`, implante tanto o servidor IPC do OpenLCA como o serviço ponte:

```bash
docker compose up -d
```

O serviço será implantado na porta **3000**.

## Verificação

Depois de implantado, verifique se o serviço responde corretamente:

```bash
# Documentação Swagger
curl http://localhost:3000/docs

# Endpoint de cálculo
curl -X POST http://localhost:3000/capture-acv \
  -H "Content-Type: application/json" \
  -d '{"metadatos": {...}}'
```
