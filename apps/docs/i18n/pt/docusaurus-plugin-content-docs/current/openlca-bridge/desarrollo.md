---
sidebar_label: 'Desenvolvimento'
sidebar_position: 6
---

# Ambiente de Desenvolvimento

## Instalação de Dependências

As dependências são geridas com [uv](https://docs.astral.sh/uv/) (`pyproject.toml` + `uv.lock`; Python 3.12, a mesma versão da imagem Docker). A partir da raiz do repositório do LCA Bridge:

```bash
uv sync
```

`uv sync` cria `.venv` com as dependências exatas de `uv.lock`, incluindo as de desenvolvimento. As dependências são adicionadas com `uv add <paquete>` (ou `uv add --dev <paquete>` se só forem usadas em desenvolvimento) e atualizadas com `uv lock --upgrade`; `pyproject.toml` e `uv.lock` são sempre submetidos em conjunto.

## [Servidor IPC do openLCA](https://github.com/GreenDelta/olca-ipc-container)

O serviço necessita de um servidor IPC do openLCA em execução. A base de dados do openLCA deve estar disponível em `openlca-docker/data/databases/ecoinvent`. Para iniciar apenas o servidor IPC do `docker-compose.yml` local:

```bash
docker compose up openlca-ipc
```

Este compose publica o servidor IPC na porta **3333** do host, enquanto o serviço o procura por defeito em `localhost:8080`. Para executar o serviço fora do Docker contra este contentor, defina `OLCA_PORT=3333` no `.env` da raiz do repositório.

## Iniciar o Servidor de Desenvolvimento

Para iniciar o servidor com recarregamento automático, a partir da raiz do repositório:

```bash
uv run uvicorn src.main:app --reload --port 3000
```

A documentação Swagger estará disponível em `http://localhost:3000/docs`.

## Testes

Os testes usam **pytest** com o `TestClient` de **Starlette** e não necessitam de um servidor openLCA: o cliente do openLCA e o envio para o LCA Compare são substituídos por mocks (`test/mocks.py`), pelo que o teste de entrada válida espera **HTTP 200**. As fichas de teste encontram-se em `test/`.

```bash
# Executar todos os testes com cobertura (equivalente a CI)
uv run pytest

# Executar um ficheiro de teste concreto
uv run pytest test/test_main.py

# Executar um teste individual
uv run pytest test/test_main.py::test_lca_capture_success
```

Não há linter, formatador nem typechecker configurados.

## Geração de Modelos

O ficheiro `src/models/lca_capture_output.py` é gerado automaticamente a partir do esquema JSON `schema/lca_capture_schema_v1.json` e não deve ser editado manualmente. Para o regenerar após modificar o esquema:

```bash
bash utils/generate_output_model.sh
```

## Estrutura do Projeto

```
.
├── src/
│   ├── client/
│   │   └── olca_client.py          # Cliente IPC do openLCA (OLCAClient)
│   ├── models/
│   │   ├── flow_dict.py            # FlowDict: fluxos de cada subprocesso
│   │   └── lca_capture_output.py   # Modelo de entrada, gerado a partir de schema/ (não editar)
│   ├── processes/
│   │   ├── process.py              # Classe base Process
│   │   ├── tomate.py               # TomateProcess
│   │   ├── olivo.py                # OlivoProcess
│   │   ├── vinedo.py               # VinedoProcess
│   │   ├── calculos.py             # Cálculos comuns (operações, fitofármacos, rega, estruturas)
│   │   └── datos_referencia.py     # Dados do Excel de referência (alfaias, fitofármacos, pesos, vidas úteis)
│   ├── services/
│   │   ├── acv_service.py          # ACVService: validação, escrita em openLCA e cálculo
│   │   └── coeficientes.py         # Cálculo com coeficientes, sem escrever em openLCA
│   └── main.py                     # Ponto de entrada FastAPI (endpoints)
├── test/                           # Testes (pytest) e fichas de entrada de teste
├── examples/                       # Exemplos de entrada e saída
├── schema/
│   └── lca_capture_schema_v1.json  # Esquema JSON da entrada
├── utils/                          # Utilitários (regeneração do modelo, envio e cálculo de fichas)
├── docs/
│   └── calculo_procesos.md         # Cálculo dos processos: fórmulas, pressupostos e decisões
├── openlca-docker/                 # Projeto Maven/Java do servidor IPC (independente)
│   └── data/databases/ecoinvent/   # Base de dados do openLCA (uso local, não versionada)
├── docker-compose.yml              # Uso local (openlca-ipc + lca-bridge)
├── Dockerfile                      # Imagem do serviço
├── pyproject.toml                  # Dependências e configuração do pytest
└── uv.lock                         # Versões exatas das dependências
```
