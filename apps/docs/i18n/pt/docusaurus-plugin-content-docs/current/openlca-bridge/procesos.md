---
sidebar_label: 'Definição de processos'
sidebar_position: 5
---

# Definição de Processos no LCA Bridge

Os **processos** são o núcleo do cálculo de ACV no LCA Bridge. Cada tipo de cultura suportado tem associado um processo que calcula, a partir dos dados do LCA Capture, as quantidades dos fluxos de entrada e saída dos seus subprocessos em openLCA, sempre **por tonelada de produto**.

Atualmente existem três processos implementados:

| Processo | Tipo de cultura | Sistema de produto em openLCA |
|---|---|---|
| `TomateProcess` | `"Tomate"` | Tomate ESCENARIO MEDIO - ES |
| `OlivoProcess` | `"Olivo"` | Olivo ESCENARIO MEDIO - ES |
| `VinedoProcess` | `"Viñedo"` | Vina ESCENARIO MEDIO - ES |

As fórmulas, pressupostos e decisões de cálculo de cada cultura estão documentados em [Cálculo dos processos](https://github.com/quercus-uex/LCA-Bridge/blob/main/docs/calculo_procesos.md), no repositório do LCA Bridge.

## Arquitetura

Os processos residem em `src/processes/`:

| Ficheiro | Conteúdo |
|---|---|
| `process.py` | Classe base `Process`. |
| `tomate.py`, `olivo.py`, `vinedo.py` | Uma subclasse por cultura. |
| `calculos.py` | Cálculos comuns a todas as culturas (operações, fitofármacos, rega, bombagem, casa de rega e espaldeira). |
| `datos_referencia.py` | Dados do Excel de referência (alfaias, fitofármacos, pesos, vidas úteis, valores por defeito). |

O `ACVService` seleciona a classe de acordo com `metadatos.cultivo.tipo` através do dicionário `PROCESS_MAP` de `src/services/acv_service.py`; um tipo que não esteja nele devolve HTTP 400:

```python
PROCESS_MAP = {
    "Tomate": TomateProcess,
    "Olivo": OlivoProcess,
    "Viñedo": VinedoProcess
}
```

## Classe Base: `Process`

A classe `Process` (`src/processes/process.py`) define a interface que cada processo implementa:

```python
from ..models.lca_capture_output import GeneratedSchema as CaptureACVOutput

class Process:
    name: str = "NONE"
    uuid: str = "NONE"

    fertilizantes_flow_name: str = "NONE"
    manejo_cultivo_flow_name: str = "NONE"
    pesticidas_flow_name: str = "NONE"
    sistema_riego_flow_name: str = "NONE"
```

### Atributos

| Atributo | Descrição |
|---|---|
| `name` | Nome da cultura; coincide com a chave de `PROCESS_MAP`. |
| `uuid` | UUID do sistema de produto na base de dados do openLCA. É o objeto que é calculado. |
| `fertilizantes_flow_name` | Nome do subprocesso (e do seu fluxo de referência) de fertilizantes em openLCA. |
| `manejo_cultivo_flow_name` | Nome do subprocesso de maneio da cultura. |
| `pesticidas_flow_name` | Nome do subprocesso de pesticidas. |
| `sistema_riego_flow_name` | Nome do subprocesso de sistema de rega. |

`OlivoProcess` e `VinedoProcess` têm ainda `estructuras_flow_name` (`"Estructuras permanentes O"` e `"Estructuras permanentes V"`), um quinto subprocesso com o aço da espaldeira e os materiais da casa de rega. O seu impacto não tem lista própria na resposta: só é somado em `impacto_total`.

### Métodos Estáticos

Cada método recebe o objeto `CaptureACVOutput` (o JSON de entrada validado) e devolve um `FlowDict`:

| Método | Descrição |
|---|---|
| `get_fertilizantes_flow(output)` | Nutrientes aplicados, transporte e emissões da fertilização. |
| `get_manejo_cultivo_flow(output)` | Operações, colheita, ocupação do solo e uso de água. |
| `get_pesticidas_flow(output)` | Substâncias ativas por categoria de pesticida e as suas emissões. |
| `get_sistema_riego_flow(output)` | Plásticos e aço da rega e energia de bombagem. |
| `get_estructuras_flow(output)` | Só Olivo e Viñedo: espaldeira e casa de rega. |
| `get_all_flows(output)` | Dicionário com os `FlowDict` de todos os subprocessos, indexado pelo seu nome. |

## Modelo `FlowDict`

`FlowDict` (`src/models/flow_dict.py`) representa os fluxos de um subprocesso com dois dicionários:

```python
class FlowDict:
    inputs: dict[str, float]    # Fluxos de entrada (nome → quantidade)
    outputs: dict[str, float]   # Fluxos de saída (nome → quantidade)
```

- As **chaves** são os nomes dos fluxos em openLCA. Um fluxo elementar que aparece em vários compartimentos distingue-se com a forma `"nombre [compartimento]"` (p. ex. `"Metribuzin [Emission to soil/agricultural]"`); procura-se primeiro essa chave e depois só o nome.
- Os **valores** são quantidades por tonelada de produto.
- Ao escrever o subprocesso, as trocas sem valor (exceto a de referência) são postas a **0**, para que não fique nenhum valor de um cálculo anterior, e é registado um aviso. As chaves que não correspondem a nenhuma troca são ignoradas, também com um aviso.

### Exemplo: Fluxo de Fertilizantes em `TomateProcess`

```python
@staticmethod
def get_fertilizantes_flow(output: CaptureACVOutput) -> FlowDict:
    # O transporte de adubos chega em t·km por tonelada de tomate; é convertido em gasóleo.
    diesel = output.fertilizantes.transporte_fert_UF_1 * datos.DIESEL_CAMION_KG_POR_TKM

    flujos = FlowDict()
    flujos.inputs = {
        **calculos.nutrientes_fertilizantes(output),
        "diesel": diesel,
    }
    flujos.outputs = {
        TomateProcess.fertilizantes_flow_name: 1,
        **calculos.emisiones_fertilizantes(output),
    }
    return flujos
```

Os `inputs` são os recursos consumidos (fertilizantes e gasóleo) e os `outputs` as emissões (NH₃, N₂O, NO₃, NOₓ). A saída com o nome do subprocesso (`fertilizantes_flow_name`) e valor `1` é o seu fluxo de referência, que o liga ao sistema de produto.

## Fluxo de Cálculo

O fluxo completo de um pedido é descrito em [Utilização](./uso.md#fluxo-de-processamento). Para o processo:

1. `get_all_flows(output)` calcula os `FlowDict` de todos os subprocessos.
2. `update_processes(flows, process.uuid)` procura cada subprocesso pelo nome entre os fornecedores do sistema de produto (os nomes de processo não são únicos em openLCA) e escreve as suas quantidades através do `OLCAClient`.
3. `calculate_impacts(process.uuid)` calcula o sistema de produto com o método de impacto configurado.
4. `build_final_result()` extrai o impacto de cada subprocesso e o total.

## Como Adicionar um Novo Processo

Para incorporar um novo tipo de cultura (por exemplo, `"Almendro"`):

### 1. Criar o Sistema de Produto em openLCA

Na base de dados do openLCA é necessário:

- Um **sistema de produto** para a nova cultura.
- Um **subprocesso** por categoria (fertilizantes, maneio da cultura, pesticidas e sistema de rega), fornecedor do sistema de produto e com um nome único entre os seus fornecedores.
- Os **fluxos** de entrada e saída de cada subprocesso.

A seguinte captura de ecrã mostra um exemplo do sistema definido em openLCA:

<p align="center">
    <img src="/img/openlca-bridge/captura-openlca.png" alt="Sistema de produto definido em openLCA" width="700"/>
</p>

### 2. Criar a Classe do Processo

Crie `src/processes/almendro.py`, reutilizando as funções de `calculos.py` e os dados de `datos_referencia.py` sempre que possível:

```python
from ..models.flow_dict import FlowDict
from ..models.lca_capture_output import GeneratedSchema as CaptureACVOutput
from . import calculos
from .process import Process


class AlmendroProcess(Process):
    name: str = "Almendro"
    uuid: str = "<UUID-del-sistema-de-producto-en-openLCA>"

    fertilizantes_flow_name: str = "Fertilizantes A"
    manejo_cultivo_flow_name: str = "Manejo de cultivo A"
    pesticidas_flow_name: str = "Pesticidas A"
    sistema_riego_flow_name: str = "Sistema de riego A"

    @staticmethod
    def get_fertilizantes_flow(output: CaptureACVOutput) -> FlowDict:
        flujos = FlowDict()
        flujos.inputs = {
            **calculos.nutrientes_fertilizantes(output),
            # ... restantes entradas do subprocesso em openLCA
        }
        flujos.outputs = {
            AlmendroProcess.fertilizantes_flow_name: 1,
            **calculos.emisiones_fertilizantes(output),
        }
        return flujos

    # get_manejo_cultivo_flow, get_pesticidas_flow e get_sistema_riego_flow seguem o mesmo padrão:
    # entradas por tonelada e saída de referência com o seu *_flow_name e valor 1.

    @staticmethod
    def get_all_flows(output: CaptureACVOutput):
        return {
            AlmendroProcess.fertilizantes_flow_name: AlmendroProcess.get_fertilizantes_flow(output),
            AlmendroProcess.manejo_cultivo_flow_name: AlmendroProcess.get_manejo_cultivo_flow(output),
            AlmendroProcess.pesticidas_flow_name: AlmendroProcess.get_pesticidas_flow(output),
            AlmendroProcess.sistema_riego_flow_name: AlmendroProcess.get_sistema_riego_flow(output),
        }
```

### 3. Registar o Processo em `PROCESS_MAP`

Adicione a classe ao dicionário `PROCESS_MAP` de `src/services/acv_service.py`, com a chave que o LCA Capture envia em `metadatos.cultivo.tipo`:

```python
PROCESS_MAP = {
    "Tomate": TomateProcess,
    "Olivo": OlivoProcess,
    "Viñedo": VinedoProcess,
    "Almendro": AlmendroProcess,
}
```

### 4. Considerações Sobre o Mapeamento de Fluxos

- **Nomes de fluxos**: uma chave que não coincide com nenhuma troca não provoca erro, mas é ignorada (com um aviso no log) e essa troca fica a 0. Convém rever os avisos ao testar o processo.
- **Nomes de subprocessos**: devem coincidir com os `*_flow_name` e ser únicos entre os fornecedores do sistema de produto; caso contrário, o cálculo falha com um erro do openLCA (HTTP 500).
- **Dados ausentes**: um fluxo sem dados vale 0. Os blocos opcionais (`bombeo`, `caseta`, `espalderas`) são tratados nas funções de `calculos.py`, que devolvem 0 quando o bloco não existe.
- **Quinto subprocesso**: se o sistema de produto tiver estruturas permanentes, adiciona-se `estructuras_flow_name` e `get_estructuras_flow`, e inclui-se em `get_all_flows`, como em `OlivoProcess`.
- **Coeficientes**: `POST /capture-acv-coeficientes` usa os mesmos `FlowDict`, pelo que não requer alterações.

### 5. Adicionar Testes

Os testes não usam o openLCA: o cliente é substituído pelos mocks de `test/mocks.py`. Para a nova cultura:

- Adicione uma ficha de teste em `test/` (por exemplo, `almendro_input.json`).
- Verifique que `get_all_flows` devolve os fluxos esperados para essa ficha.
- Verifique que `POST /capture-acv` responde **HTTP 200** com o cliente do openLCA simulado.
