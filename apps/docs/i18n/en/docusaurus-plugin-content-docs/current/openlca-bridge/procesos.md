---
sidebar_label: 'Process Definition'
sidebar_position: 5
---

# Process Definition in LCA Bridge

In LCA Bridge, each supported crop type has an associated **process** that calculates, from the LCA Capture data, the amounts of the input and output flows of its openLCA subprocesses, always **per tonne of product**.

There are currently three implemented processes:

| Process | Crop type | Product system in openLCA |
|---|---|---|
| `TomateProcess` | `"Tomate"` | Tomate ESCENARIO MEDIO - ES |
| `OlivoProcess` | `"Olivo"` | Olivo ESCENARIO MEDIO - ES |
| `VinedoProcess` | `"Viñedo"` | Vina ESCENARIO MEDIO - ES |

The formulas, assumptions, and calculation decisions for each crop are documented in [Process calculation](https://github.com/quercus-uex/LCA-Bridge/blob/main/docs/calculo_procesos.md), in the LCA Bridge repository.

## Architecture

Processes live in `src/processes/`:

| File | Contents |
|---|---|
| `process.py` | `Process` base class. |
| `tomate.py`, `olivo.py`, `vinedo.py` | One subclass per crop. |
| `calculos.py` | Calculations shared by all crops (operations, plant protection products, irrigation, pumping, shed, and trellis). |
| `datos_referencia.py` | Data from the reference Excel file (implements, plant protection products, weights, service lives, default values). |

`ACVService` selects the class according to `metadatos.cultivo.tipo` through the `PROCESS_MAP` dictionary in `src/services/acv_service.py`; a type that is not in it returns HTTP 400:

```python
PROCESS_MAP = {
    "Tomate": TomateProcess,
    "Olivo": OlivoProcess,
    "Viñedo": VinedoProcess
}
```

## Base Class: `Process`

The `Process` class (`src/processes/process.py`) defines the interface that each process implements:

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

### Attributes

| Attribute | Description |
|---|---|
| `name` | Crop name; it matches the `PROCESS_MAP` key. |
| `uuid` | UUID of the product system in the openLCA database. This is the object that gets calculated. |
| `fertilizantes_flow_name` | Name of the fertilizer subprocess (and of its reference flow) in openLCA. |
| `manejo_cultivo_flow_name` | Name of the crop management subprocess. |
| `pesticidas_flow_name` | Name of the pesticide subprocess. |
| `sistema_riego_flow_name` | Name of the irrigation system subprocess. |

`OlivoProcess` and `VinedoProcess` also have `estructuras_flow_name` (`"Estructuras permanentes O"` and `"Estructuras permanentes V"`), a fifth subprocess with the trellis steel and the irrigation shed materials. Its impact is added to `impacto_total`, with no list of its own in the response.

### Static Methods

Each method receives the `CaptureACVOutput` object (the validated input JSON) and returns a `FlowDict`:

| Method | Description |
|---|---|
| `get_fertilizantes_flow(output)` | Applied nutrients, transport, and fertilization emissions. |
| `get_manejo_cultivo_flow(output)` | Operations, harvesting, land occupation, and water use. |
| `get_pesticidas_flow(output)` | Active ingredients by pesticide category and their emissions. |
| `get_sistema_riego_flow(output)` | Irrigation plastics and steel, and pumping energy. |
| `get_estructuras_flow(output)` | Olivo and Viñedo only: trellis and shed. |
| `get_all_flows(output)` | Dictionary with the `FlowDict` of every subprocess, keyed by its name. |

## `FlowDict` Model

`FlowDict` (`src/models/flow_dict.py`) represents the flows of a subprocess with two dictionaries:

```python
class FlowDict:
    inputs: dict[str, float]    # Input flows (name → amount)
    outputs: dict[str, float]   # Output flows (name → amount)
```

- **Keys** are the flow names in openLCA. An elementary flow that appears in several compartments is distinguished with the form `"name [compartment]"` (e.g. `"Metribuzin [Emission to soil/agricultural]"`); that key is looked up first, then the name alone.
- **Values** are amounts per tonne of product.
- When the subprocess is written, exchanges without a value (except the reference one) are set to 0 instead of keeping the value from a previous calculation, and a warning is logged. Keys that do not match any exchange are ignored, also with a warning.

### Example: Fertilizer Flow in `TomateProcess`

```python
@staticmethod
def get_fertilizantes_flow(output: CaptureACVOutput) -> FlowDict:
    # Fertilizer transport arrives in t·km per tonne of tomato; it is converted to diesel.
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

The `inputs` are the consumed resources (fertilizers and diesel) and the `outputs` are the emissions (NH₃, N₂O, NO₃, NOₓ). The output named after the subprocess (`fertilizantes_flow_name`) with value `1` is its reference flow, which connects it to the product system.

## Calculation Flow

The complete flow of a request is described in [Usage](./uso.md#processing-flow). For the process:

1. `get_all_flows(output)` calculates the `FlowDict` of every subprocess.
2. `update_processes(flows, process.uuid)` looks up each subprocess by name among the providers of the product system (process names are not unique in openLCA) and writes its amounts through `OLCAClient`.
3. `calculate_impacts(process.uuid)` calculates the product system with the configured impact method.
4. `build_final_result()` extracts the impact of each subprocess and the total.

## How to Add a New Process

To add a new crop type (for example, `"Almendro"`):

### 1. Create the Product System in openLCA

The openLCA database needs:

- A **product system** for the new crop.
- One **subprocess** per category (fertilizers, crop management, pesticides, and irrigation system), each a provider of the product system and with a unique name among its providers.
- The input and output **flows** of each subprocess.

The following screenshot shows an example of the system defined in openLCA:

<p align="center">
    <img src="/img/openlca-bridge/captura-openlca.png" alt="Product system defined in openLCA" width="700"/>
</p>

### 2. Create the Process Class

Create `src/processes/almendro.py`, reusing the functions in `calculos.py` and the data in `datos_referencia.py` whenever possible:

```python
from ..models.flow_dict import FlowDict
from ..models.lca_capture_output import GeneratedSchema as CaptureACVOutput
from . import calculos
from .process import Process


class AlmendroProcess(Process):
    name: str = "Almendro"
    uuid: str = "<openLCA-product-system-UUID>"

    fertilizantes_flow_name: str = "Fertilizantes A"
    manejo_cultivo_flow_name: str = "Manejo de cultivo A"
    pesticidas_flow_name: str = "Pesticidas A"
    sistema_riego_flow_name: str = "Sistema de riego A"

    @staticmethod
    def get_fertilizantes_flow(output: CaptureACVOutput) -> FlowDict:
        flujos = FlowDict()
        flujos.inputs = {
            **calculos.nutrientes_fertilizantes(output),
            # ... remaining inputs of the subprocess in openLCA
        }
        flujos.outputs = {
            AlmendroProcess.fertilizantes_flow_name: 1,
            **calculos.emisiones_fertilizantes(output),
        }
        return flujos

    # get_manejo_cultivo_flow, get_pesticidas_flow and get_sistema_riego_flow follow the same pattern:
    # inputs per tonne and a reference output with its *_flow_name and value 1.

    @staticmethod
    def get_all_flows(output: CaptureACVOutput):
        return {
            AlmendroProcess.fertilizantes_flow_name: AlmendroProcess.get_fertilizantes_flow(output),
            AlmendroProcess.manejo_cultivo_flow_name: AlmendroProcess.get_manejo_cultivo_flow(output),
            AlmendroProcess.pesticidas_flow_name: AlmendroProcess.get_pesticidas_flow(output),
            AlmendroProcess.sistema_riego_flow_name: AlmendroProcess.get_sistema_riego_flow(output),
        }
```

### 3. Register the Process in `PROCESS_MAP`

Add the class to the `PROCESS_MAP` dictionary in `src/services/acv_service.py`, with the key that LCA Capture sends in `metadatos.cultivo.tipo`:

```python
PROCESS_MAP = {
    "Tomate": TomateProcess,
    "Olivo": OlivoProcess,
    "Viñedo": VinedoProcess,
    "Almendro": AlmendroProcess,
}
```

### 4. Flow Mapping Considerations

- **Flow names**: a key that does not match any exchange does not raise an error, but it is ignored (with a warning in the log) and that exchange is left at 0. Review the warnings when testing the process.
- **Subprocess names**: they must match the `*_flow_name` values and be unique among the providers of the product system; otherwise, the calculation fails with an openLCA error (HTTP 500).
- **Missing data**: a flow without data is 0. Optional blocks (`bombeo`, `caseta`, `espalderas`) are handled in the `calculos.py` functions, which return 0 when the block does not exist.
- **Fifth subprocess**: if the product system has permanent structures, add `estructuras_flow_name` and `get_estructuras_flow`, and include it in `get_all_flows`, as in `OlivoProcess`.
- **Coefficients**: `POST /capture-acv-coeficientes` uses the same `FlowDict` objects, so it requires no changes.

### 5. Add Tests

Tests do not connect to openLCA; the client is replaced by the mocks in `test/mocks.py`. For the new crop:

- Add a test input file in `test/` (for example, `almendro_input.json`).
- Verify that `get_all_flows` returns the expected flows for that input.
- Verify that `POST /capture-acv` returns HTTP 200 with the mocked openLCA client.
