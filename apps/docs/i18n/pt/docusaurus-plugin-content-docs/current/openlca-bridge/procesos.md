---
sidebar_label: 'Definição de processos'
sidebar_position: 5
---

# Definição de Processos no Capture ACV

Os **processos** são o núcleo do cálculo de ACV no Capture ACV. Cada tipo de cultura suportado tem associado um processo que define como os dados agronómicos do DTAgro são mapeados para os fluxos de entrada e saída do openLCA.

Atualmente existem três processos implementados:

| Processo | Tipo de cultura |
|---|---|
| `TomateProcess` | `"Tomate"` |
| `OlivoProcess` | `"Olivo"` |
| `VinedoProcess` | `"Vinedo"` |

## Arquitetura

Os processos residem em `src/processes/` e seguem uma hierarquia de herança simples:

```
Process (clase base abstracta)
├── TomateProcess
├── OlivoProcess
└── VinedoProcess
```

O serviço `ACVService` seleciona a classe adequada através de `get_process_class()` com base no valor de `metadatos.cultivo.tipo` do JSON de entrada:

```python
def get_process_class(tipo: str) -> type[Process]:
    match tipo:
        case "Tomate":
            return TomateProcess
        case "Olivo":
            return OlivoProcess
        case "Vinedo":
            return VinedoProcess
```

## Classe Base: `Process`

A classe `Process` (`src/processes/process.py`) define a interface que todos os processos devem implementar:

```python
from ..models.dtagro_acv_output import GeneratedSchema as CaptureACVOutput

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
| `name` | Nome do processo. Deve coincidir com o valor de `metadatos.cultivo.tipo` que o DTAgro envia no JSON. |
| `uuid` | UUID do sistema de produto na base de dados .zolca do openLCA. É o ponto de entrada do cálculo de impacto. |
| `fertilizantes_flow_name` | Nome do fluxo intermédio de fertilizantes em openLCA. |
| `manejo_cultivo_flow_name` | Nome do fluxo intermédio de maneio da cultura em openLCA. |
| `pesticidas_flow_name` | Nome do fluxo intermédio de pesticidas em openLCA. |
| `sistema_riego_flow_name` | Nome do fluxo intermédio de sistema de rega em openLCA. |

### Métodos Estáticos

Cada processo deve implementar cinco métodos estáticos que recebem o objeto `CaptureACVOutput` (o JSON de entrada parseado) e devolvem um `FlowDict`:

| Método | Descrição |
|---|---|
| `get_fertilizantes_flow(output)` | Mapeia os dados de fertilização para fluxos de openLCA. |
| `get_manejo_cultivo_flow(output)` | Mapeia as operações agrícolas e o uso do solo para fluxos de openLCA. |
| `get_pesticidas_flow(output)` | Mapeia os produtos fitossanitários para fluxos de openLCA. |
| `get_sistema_riego_flow(output)` | Mapeia os componentes do sistema de rega para fluxos de openLCA. |
| `get_all_flows(output)` | Devolve um dicionário com os quatro fluxos anteriores, keyed pelos seus nomes. |

## Modelo `FlowDict`

`FlowDict` é a estrutura que representa um conjunto de fluxos de openLCA. Contém dois dicionários:

```python
class FlowDict:
    inputs: dict[str, float]    # Flujos de entrada (nombre → cantidad)
    outputs: dict[str, float]   # Flujos de salida (nombre → cantidad)
```

- As **chaves** são os nomes exatos dos fluxos tal como estão definidos na base de dados .zolca do openLCA.
- Os **valores** são as quantidades extraídas do JSON de entrada do DTAgro.

### Exemplo: Fluxo de Fertilizantes em `TomateProcess`

```python
@staticmethod
def get_fertilizantes_flow(output: CaptureACVOutput) -> FlowDict:
    fertilizantes = FlowDict()
    fertilizantes.inputs = {
        "diesel, burned in agricultural machinery": output.fertilizantes.transporte_fert_UF_1,
        "inorganic nitrogen fertiliser, as N": output.fertilizantes.kg_N,
        "inorganic phosphorus fertiliser, as P2O5": output.fertilizantes.kg_P2O5,
        "inorganic potassium fertiliser, as K2O": output.fertilizantes.kg_K2O
    }
    fertilizantes.outputs = {
        TomateProcess.fertilizantes_flow_name: 1,
        "Ammonia": output.fertilizantes.kg_NH3,
        "Dinitrogen monoxide": output.fertilizantes.kg_N2O,
        "Nitrate": output.fertilizantes.kg_NO3,
        "Nitrogen oxides": output.fertilizantes.kg_NOX
    }
    return fertilizantes
```

Os `inputs` representam os recursos consumidos (fertilizantes, combustível) e os `outputs` as emissões geradas (NH₃, N₂O, NO₃, NOₓ). O fluxo de saída com o nome do processo (`fertilizantes_flow_name`) com valor `1` atua como conector com o sistema de produto principal em openLCA.

## Fluxo de Cálculo

Quando `ACVService.execute()` recebe um pedido, o processo é usado da seguinte forma:

```
1. get_process_class(tipo)           → Selecciona TomateProcess / OlivoProcess / VinedoProcess
2. process.get_all_flows(output)     → Obtiene los 4 FlowDict (fertilizantes, manejo, pesticidas, riego)
3. update_processes(flows, process)  → Actualiza cada subproceso en openLCA vía OLCAClient (IPC)
4. calculate_impacts(process.uuid)   → Ejecuta el cálculo de impacto sobre el sistema de producto
5. build_final_result()              → Construye el resultado estructurado por categoría
```

Cada subprocesso (fertilizantes, maneio da cultura, pesticidas, sistema de rega) é atualizado de forma independente em openLCA antes de executar o cálculo global. Isto permite que os valores dos fluxos reflitam os dados reais da cultura enviada pelo DTAgro.

## Como Adicionar um Novo Processo

Para incorporar suporte para um novo tipo de cultura (por exemplo, `"Almendro"`), siga estes passos:

### 1. Criar o Sistema de Produto em openLCA

Antes de tocar no código, é necessário definir na base de dados .zolca:

- Um **sistema de produto** para a nova cultura com o seu UUID correspondente.
- Quatro **subprocessos** para as categorias: fertilizantes, maneio da cultura, pesticidas e sistema de rega.
- Os **fluxos** de entrada e saída que ligam os subprocessos ao sistema de produto principal.

Os nomes dos fluxos devem coincidir exatamente com os que serão usados no código.

### 2. Criar a Classe do Processo

Crie um novo ficheiro em `src/processes/`, por exemplo `almendro_process.py`:

```python
from ..models.flow_dict import FlowDict
from .process import Process
from ..models.dtagro_acv_output import GeneratedSchema as CaptureACVOutput

class AlmendroProcess(Process):
    name: str = "Almendro"
    uuid: str = "<UUID-del-sistema-de-producto-en-openLCA>"

    fertilizantes_flow_name: str = "Fertilizantes A"
    manejo_cultivo_flow_name: str = "Manejo de cultivo A"
    pesticidas_flow_name: str = "Pesticidas A"
    sistema_riego_flow_name: str = "Sistema de riego A"

    @staticmethod
    def get_fertilizantes_flow(output: CaptureACVOutput) -> FlowDict:
        fertilizantes = FlowDict()
        fertilizantes.inputs = {
            # Mapear campos de output.fertilizantes a flujos de openLCA
            "diesel, burned in agricultural machinery": output.fertilizantes.transporte_fert_UF_1,
            "inorganic nitrogen fertiliser, as N": output.fertilizantes.kg_N,
            # ... añadir según los flujos definidos en openLCA
        }
        fertilizantes.outputs = {
            AlmendroProcess.fertilizantes_flow_name: 1,
            "Ammonia": output.fertilizantes.kg_NH3,
            # ... añadir según los flujos definidos en openLCA
        }
        return fertilizantes

    @staticmethod
    def get_manejo_cultivo_flow(output: CaptureACVOutput) -> FlowDict:
        manejo_cultivo = FlowDict()
        manejo_cultivo.inputs = {
            # Mapear campos de output.manejo_cultivo y output.maquinaria
            # ...
        }
        manejo_cultivo.outputs = {
            AlmendroProcess.manejo_cultivo_flow_name: 1
        }
        return manejo_cultivo

    @staticmethod
    def get_pesticidas_flow(output: CaptureACVOutput) -> FlowDict:
        pesticidas = FlowDict()
        pesticidas.inputs = {
            # Mapear campos de output.fitosanitarios.detalle por clasificación SimaPro
            # ...
        }
        pesticidas.outputs = {
            AlmendroProcess.pesticidas_flow_name: 1,
        }
        return pesticidas

    @staticmethod
    def get_sistema_riego_flow(output: CaptureACVOutput) -> FlowDict:
        sistema_riego = FlowDict()
        sistema_riego.inputs = {
            # Mapear campos de output.riegos y output.bombeo
            # ...
        }
        sistema_riego.outputs = {
            AlmendroProcess.sistema_riego_flow_name: 1,
        }
        return sistema_riego

    @staticmethod
    def get_all_flows(output: CaptureACVOutput):
        return {
            AlmendroProcess.fertilizantes_flow_name: AlmendroProcess.get_fertilizantes_flow(output),
            AlmendroProcess.manejo_cultivo_flow_name: AlmendroProcess.get_manejo_cultivo_flow(output),
            AlmendroProcess.pesticidas_flow_name: AlmendroProcess.get_pesticidas_flow(output),
            AlmendroProcess.sistema_riego_flow_name: AlmendroProcess.get_sistema_riego_flow(output)
        }
```

### 3. Registar o Processo em `get_process_class()`

Adicione o novo caso na função de seleção de processos:

```python
def get_process_class(tipo: str) -> type[Process]:
    match tipo:
        case "Tomate":
            return TomateProcess
        case "Olivo":
            return OlivoProcess
        case "Vinedo":
            return VinedoProcess
        case "Almendro":
            return AlmendroProcess
```

### 4. Considerações Sobre o Mapeamento de Fluxos

Ao implementar os métodos `get_*_flow`, tenha em conta o seguinte:

- **Nomes de fluxos**: devem coincidir **exatamente** com os definidos na base de dados .zolca. Um erro no nome fará com que o openLCA não encontre o fluxo e o cálculo falhe.
- **Valores por defeito**: quando um campo do JSON de entrada pode não estar presente (por exemplo, se não há operações ou maquinaria), use um valor por defeito de `1` para evitar erros de acesso a índices inexistentes. Observe como `TomateProcess` protege o acesso a arrays com verificações de comprimento:

  ```python
  output.manejo_cultivo.labores[0].fabricacion if len(output.manejo_cultivo.labores) > 0 else 1
  ```

- **Fluxos de saída do processo**: cada subprocesso deve ter um output com o seu `*_flow_name` e valor `1`. Este fluxo atua como conector com o sistema de produto principal em openLCA.
- **Campos opcionais**: alguns blocos do JSON como `bombeo` podem ser `null`. Proteja o acesso com verificações:

  ```python
  output.bombeo.potencia if output.bombeo else 1
  ```

### 5. Adicionar Testes

Crie uma fixture de teste em `test/` com um JSON de exemplo para o novo tipo de cultura e verifique que:

- `get_process_class("Almendro")` devolve `AlmendroProcess`.
- Cada método `get_*_flow` devolve um `FlowDict` com os fluxos esperados.
- O endpoint `POST /capture-acv` processa corretamente o novo tipo (devolverá HTTP 500 se openLCA não estiver disponível, mas a validação do esquema deve passar).
