---
sidebar_label: 'Process Definition'
sidebar_position: 5
---

# Process Definition in Capture ACV

**Processes** are the core of LCA calculation in Capture ACV. Each supported crop type has an associated process that defines how DTAgro agronomic data maps to openLCA input and output flows.

There are currently three implemented processes:

| Process | Crop type |
|---|---|
| `TomateProcess` | `"Tomate"` |
| `OlivoProcess` | `"Olivo"` |
| `VinedoProcess` | `"Vinedo"` |

## Architecture

Processes live in `src/processes/` and follow a simple inheritance hierarchy:

```
Process (abstract base class)
├── TomateProcess
├── OlivoProcess
└── VinedoProcess
```

The `ACVService` service selects the appropriate class through `get_process_class()` based on the value of `metadatos.cultivo.tipo` in the input JSON:

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

## Base Class: `Process`

The `Process` class (`src/processes/process.py`) defines the interface that every process must implement:

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

### Attributes

| Attribute | Description |
|---|---|
| `name` | Process name. It must match the `metadatos.cultivo.tipo` value sent by DTAgro in the JSON. |
| `uuid` | Product system UUID in the openLCA .zolca database. It is the entry point for the impact calculation. |
| `fertilizantes_flow_name` | Name of the intermediate fertilizer flow in openLCA. |
| `manejo_cultivo_flow_name` | Name of the intermediate crop management flow in openLCA. |
| `pesticidas_flow_name` | Name of the intermediate pesticide flow in openLCA. |
| `sistema_riego_flow_name` | Name of the intermediate irrigation system flow in openLCA. |

### Static Methods

Each process must implement five static methods that receive the `CaptureACVOutput` object (the parsed input JSON) and return a `FlowDict`:

| Method | Description |
|---|---|
| `get_fertilizantes_flow(output)` | Maps fertilization data to openLCA flows. |
| `get_manejo_cultivo_flow(output)` | Maps agricultural operations and land use to openLCA flows. |
| `get_pesticidas_flow(output)` | Maps plant protection products to openLCA flows. |
| `get_sistema_riego_flow(output)` | Maps irrigation system components to openLCA flows. |
| `get_all_flows(output)` | Returns a dictionary with the four previous flows, keyed by their names. |

## `FlowDict` Model

`FlowDict` is the structure that represents a set of openLCA flows. It contains two dictionaries:

```python
class FlowDict:
    inputs: dict[str, float]    # Input flows (name → amount)
    outputs: dict[str, float]   # Output flows (name → amount)
```

- **Keys** are the exact flow names as defined in the openLCA .zolca database.
- **Values** are the amounts extracted from the DTAgro input JSON.

### Example: Fertilizer Flow in `TomateProcess`

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

The `inputs` represent consumed resources (fertilizers, fuel), and the `outputs` represent generated emissions (NH₃, N₂O, NO₃, NOₓ). The output flow with the process name (`fertilizantes_flow_name`) and value `1` acts as the connector to the main product system in openLCA.

## Calculation Flow

When `ACVService.execute()` receives a request, the process is used as follows:

```
1. get_process_class(tipo)           → Selects TomateProcess / OlivoProcess / VinedoProcess
2. process.get_all_flows(output)     → Gets the 4 FlowDict objects (fertilizers, crop management, pesticides, irrigation)
3. update_processes(flows, process)  → Updates each subprocess in openLCA through OLCAClient (IPC)
4. calculate_impacts(process.uuid)   → Runs the impact calculation on the product system
5. build_final_result()              → Builds the structured result by category
```

Each subprocess (fertilizers, crop management, pesticides, irrigation system) is updated independently in openLCA before running the global calculation. This lets flow values reflect the real crop data sent by DTAgro.

## How to Add a New Process

To add support for a new crop type (for example, `"Almendro"`), follow these steps:

### 1. Create the Product System in openLCA

Before changing code, define the following in the .zolca database:

- A **product system** for the new crop with its corresponding UUID.
- Four **subprocesses** for the categories: fertilizers, crop management, pesticides, and irrigation system.
- The **input and output flows** that connect the subprocesses with the main product system.

Flow names must exactly match the names you will use in code.

### 2. Create the Process Class

Create a new file under `src/processes/`, for example `almendro_process.py`:

```python
from ..models.flow_dict import FlowDict
from .process import Process
from ..models.dtagro_acv_output import GeneratedSchema as CaptureACVOutput

class AlmendroProcess(Process):
    name: str = "Almendro"
    uuid: str = "<openLCA-product-system-UUID>"

    fertilizantes_flow_name: str = "Fertilizantes A"
    manejo_cultivo_flow_name: str = "Manejo de cultivo A"
    pesticidas_flow_name: str = "Pesticidas A"
    sistema_riego_flow_name: str = "Sistema de riego A"

    @staticmethod
    def get_fertilizantes_flow(output: CaptureACVOutput) -> FlowDict:
        fertilizantes = FlowDict()
        fertilizantes.inputs = {
            # Map output.fertilizantes fields to openLCA flows
            "diesel, burned in agricultural machinery": output.fertilizantes.transporte_fert_UF_1,
            "inorganic nitrogen fertiliser, as N": output.fertilizantes.kg_N,
            # ... add according to the flows defined in openLCA
        }
        fertilizantes.outputs = {
            AlmendroProcess.fertilizantes_flow_name: 1,
            "Ammonia": output.fertilizantes.kg_NH3,
            # ... add according to the flows defined in openLCA
        }
        return fertilizantes

    @staticmethod
    def get_manejo_cultivo_flow(output: CaptureACVOutput) -> FlowDict:
        manejo_cultivo = FlowDict()
        manejo_cultivo.inputs = {
            # Map output.manejo_cultivo and output.maquinaria fields
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
            # Map output.fitosanitarios.detalle fields by SimaPro classification
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
            # Map output.riegos and output.bombeo fields
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

### 3. Register the Process in `get_process_class()`

Add the new case to the process selection function:

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

### 4. Flow Mapping Considerations

When implementing the `get_*_flow` methods, keep the following in mind:

- **Flow names**: they must match **exactly** those defined in the openLCA .zolca database. A name mismatch will prevent openLCA from finding the flow and will make the calculation fail.
- **Default values**: when a field in the input JSON may be missing (for example, when there are no operations or machinery), use a default value of `1` to avoid access errors on nonexistent indexes. See how `TomateProcess` protects array access with length checks:

  ```python
  output.manejo_cultivo.labores[0].fabricacion if len(output.manejo_cultivo.labores) > 0 else 1
  ```

- **Process output flows**: each subprocess must have an output with its `*_flow_name` and value `1`. This flow acts as the connector to the main product system in openLCA.
- **Optional fields**: some JSON blocks such as `bombeo` may be `null`. Protect access with checks:

  ```python
  output.bombeo.potencia if output.bombeo else 1
  ```

### 5. Add Tests

Create a test fixture under `test/` with an example JSON for the new crop type and verify that:

- `get_process_class("Almendro")` returns `AlmendroProcess`.
- Each `get_*_flow` method returns a `FlowDict` with the expected flows.
- The `POST /capture-acv` endpoint processes the new type correctly (it will return HTTP 500 if openLCA is not available, but schema validation must pass).
