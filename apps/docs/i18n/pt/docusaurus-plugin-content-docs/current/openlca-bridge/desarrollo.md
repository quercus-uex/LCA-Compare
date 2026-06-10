---
sidebar_label: 'Desenvolvimento'
sidebar_position: 6
---

# Ambiente de Desenvolvimento

## DevContainer

Para o desenvolvimento do serviço foram usados [DevContainers](https://containers.dev), uma solução baseada em Docker que permite ter ambientes isolados para cada desenvolvimento. Para o utilizar, basta abrir o repositório do serviço num dos IDEs com suporte habilitado para DevContainers (Visual Studio Code, PyCharm, ...).

## Instalação de Dependências

Uma vez dentro do DevContainer, crie um ambiente virtual de Python 3.12+ e instale as dependências:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Servidor IPC do OpenLCA

O serviço necessita de um servidor IPC do OpenLCA em execução. A base de dados do OpenLCA deve estar disponível em `openlca-docker/data/databases/bafu`. Para iniciar o servidor IPC, implante esse serviço do Docker Compose:

```bash
docker compose up openlca-ipc
```

## Iniciar o Servidor de Desenvolvimento

Para iniciar o servidor em modo desenvolvimento com hot reload, execute o seguinte comando dentro da pasta `src/`:

```bash
fastapi dev
```

A documentação Swagger estará disponível em `http://localhost:3000/docs`.

## Testes

Os testes usam **pytest** com o cliente de teste de **Starlette**. As fixtures encontram-se no diretório `test/`:

```bash
# Executar todos os testes com cobertura (recomendado — equivalente a CI)
tox -e py

# Executar um ficheiro de teste concreto
pytest test_main.py

# Executar um teste individual
pytest test_main.py::test_dtagro_acv_valid
```

:::note
O teste de entrada válida (`test_dtagro_acv_valid`) espera um código **HTTP 500** em vez de 200, porque o servidor OpenLCA não está disponível no ambiente de CI.
:::

Não há linter, formatador nem typechecker configurados.

## Geração de Modelos

O ficheiro `src/models/dtagro_acv_output.py` é gerado automaticamente a partir do esquema JSON `schema/dtagro_schema_v1.json`. Não deve ser editado manualmente. Para o regenerar após modificar o esquema:

```bash
bash utils/generate_output_model.sh
```

## Estrutura do Projeto

```
.
├── src/                              # Código-fonte do serviço (Python)
│   ├── main.py                       # Ponto de entrada da aplicação FastAPI
│   ├── acv_service.py                # ACVService: lógica principal de cálculo
│   ├── routers/                      # Definição de endpoints
│   ├── services/                     # OLCAClient e gestão de processos
│   ├── models/                       # Modelos Pydantic
│   │   └── dtagro_acv_output.py      # Autogerado a partir de schema/
│   ├── processes/                    # Processos por tipo de cultura
│   │   ├── tomate_process.py         # TomateProcess
│   │   ├── olivo_process.py          # OlivoProcess
│   │   └── vinedo_process.py         # VinedoProcess
│   └── templates/                    # Templates para cálculos de ACV
├── schema/
│   └── dtagro_schema_v1.json         # Esquema JSON para geração de modelos
├── utils/
│   └── generate_output_model.sh      # Script de regeneração de modelos
├── test/                             # Testes e fixtures
├── openlca-docker/                   # Projeto Maven/Java do servidor IPC (independente)
│   └── data/databases/bafu/          # Rota da base de dados .zolca
├── requirements.txt                  # Dependências de Python
├── Dockerfile                        # Imagem do serviço
├── docker-compose.yml                # Orquestração (openlca-ipc + bridge)
├── tox.ini                           # Configuração de tox para testes
└── .devcontainer/                    # Configuração de DevContainer
```
