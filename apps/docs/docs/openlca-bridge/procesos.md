---
sidebar_label: 'Definición de procesos'
sidebar_position: 5
---

# Definición de procesos en LCA Bridge

Los **procesos** son el núcleo del cálculo de ACV en LCA Bridge. Cada tipo de cultivo soportado tiene asociado un
proceso que calcula, a partir de los datos de LCA Capture, las cantidades de los flujos de entrada y salida de sus
subprocesos en openLCA, siempre **por tonelada de producto**.

Actualmente existen tres procesos implementados:

| Proceso | Tipo de cultivo | Sistema de producto en openLCA |
|---|---|---|
| `TomateProcess` | `"Tomate"` | Tomate ESCENARIO MEDIO - ES |
| `OlivoProcess` | `"Olivo"` | Olivo ESCENARIO MEDIO - ES |
| `VinedoProcess` | `"Viñedo"` | Vina ESCENARIO MEDIO - ES |

Las fórmulas, supuestos y decisiones de cálculo de cada cultivo se documentan en
[Cálculo de los procesos](https://github.com/quercus-uex/LCA-Bridge/blob/main/docs/calculo_procesos.md), en el
repositorio de LCA Bridge.

## Arquitectura

Los procesos residen en `src/processes/`:

| Fichero | Contenido |
|---|---|
| `process.py` | Clase base `Process`. |
| `tomate.py`, `olivo.py`, `vinedo.py` | Una subclase por cultivo. |
| `calculos.py` | Cálculos comunes a todos los cultivos (labores, fitosanitarios, riego, bombeo, caseta y espaldera). |
| `datos_referencia.py` | Datos del Excel de referencia (aperos, fitosanitarios, pesos, vidas útiles, valores por defecto). |

`ACVService` selecciona la clase según `metadatos.cultivo.tipo` mediante el diccionario `PROCESS_MAP` de
`src/services/acv_service.py`; un tipo que no esté en él devuelve HTTP 400:

```python
PROCESS_MAP = {
    "Tomate": TomateProcess,
    "Olivo": OlivoProcess,
    "Viñedo": VinedoProcess
}
```

## Clase base: `Process`

La clase `Process` (`src/processes/process.py`) define la interfaz que implementa cada proceso:

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

| Atributo | Descripción |
|---|---|
| `name` | Nombre del cultivo; coincide con la clave de `PROCESS_MAP`. |
| `uuid` | UUID del sistema de producto en la base de datos de openLCA. Es el objeto que se calcula. |
| `fertilizantes_flow_name` | Nombre del subproceso (y de su flujo de referencia) de fertilizantes en openLCA. |
| `manejo_cultivo_flow_name` | Nombre del subproceso de manejo de cultivo. |
| `pesticidas_flow_name` | Nombre del subproceso de pesticidas. |
| `sistema_riego_flow_name` | Nombre del subproceso de sistema de riego. |

`OlivoProcess` y `VinedoProcess` tienen además `estructuras_flow_name` (`"Estructuras permanentes O"` y
`"Estructuras permanentes V"`), un quinto subproceso con el acero de la espaldera y los materiales de la caseta de
riego. Su impacto no tiene lista propia en la respuesta: solo se suma en `impacto_total`.

### Métodos estáticos

Cada método recibe el objeto `CaptureACVOutput` (el JSON de entrada validado) y devuelve un `FlowDict`:

| Método | Descripción |
|---|---|
| `get_fertilizantes_flow(output)` | Nutrientes aplicados, transporte y emisiones de la fertilización. |
| `get_manejo_cultivo_flow(output)` | Labores, cosecha, ocupación del suelo y uso de agua. |
| `get_pesticidas_flow(output)` | Materias activas por categoría de pesticida y sus emisiones. |
| `get_sistema_riego_flow(output)` | Plásticos y acero del riego y energía de bombeo. |
| `get_estructuras_flow(output)` | Solo Olivo y Viñedo: espaldera y caseta. |
| `get_all_flows(output)` | Diccionario con los `FlowDict` de todos los subprocesos, indexado por su nombre. |

## Modelo `FlowDict`

`FlowDict` (`src/models/flow_dict.py`) representa los flujos de un subproceso con dos diccionarios:

```python
class FlowDict:
    inputs: dict[str, float]    # Flujos de entrada (nombre → cantidad)
    outputs: dict[str, float]   # Flujos de salida (nombre → cantidad)
```

- Las **claves** son los nombres de los flujos en openLCA. Un flujo elemental que aparece en varios compartimentos se
  distingue con la forma `"nombre [compartimento]"` (p. ej. `"Metribuzin [Emission to soil/agricultural]"`); se
  busca primero esa clave y después el nombre solo.
- Los **valores** son cantidades por tonelada de producto.
- Al escribir el subproceso, los intercambios sin valor (salvo el de referencia) se ponen a **0**, para que no quede
  ningún valor de un cálculo anterior, y se registra un aviso. Las claves que no corresponden a ningún intercambio
  se ignoran, también con un aviso.

### Ejemplo: flujo de fertilizantes en `TomateProcess`

```python
@staticmethod
def get_fertilizantes_flow(output: CaptureACVOutput) -> FlowDict:
    # El transporte de abonos llega en t·km por tonelada de tomate; se pasa a gasóleo.
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

Los `inputs` son los recursos consumidos (fertilizantes y gasóleo) y los `outputs` las emisiones (NH₃, N₂O, NO₃,
NOₓ). La salida con el nombre del subproceso (`fertilizantes_flow_name`) y valor `1` es su flujo de referencia, que lo
conecta con el sistema de producto.

## Flujo de cálculo

El flujo completo de una petición se describe en [Uso](./uso.md#flujo-de-procesamiento). Para el proceso:

1. `get_all_flows(output)` calcula los `FlowDict` de todos los subprocesos.
2. `update_processes(flows, process.uuid)` busca cada subproceso por nombre entre los proveedores del sistema de
   producto (los nombres de proceso no son únicos en openLCA) y escribe sus cantidades vía `OLCAClient`.
3. `calculate_impacts(process.uuid)` calcula el sistema de producto con el método de impacto configurado.
4. `build_final_result()` extrae el impacto de cada subproceso y el total.

## Cómo añadir un nuevo proceso

Para incorporar un nuevo tipo de cultivo (por ejemplo, `"Almendro"`):

### 1. Crear el sistema de producto en openLCA

En la base de datos de openLCA se necesita:

- Un **sistema de producto** para el nuevo cultivo.
- Un **subproceso** por categoría (fertilizantes, manejo de cultivo, pesticidas y sistema de riego), proveedor del
  sistema de producto y con un nombre único entre sus proveedores.
- Los **flujos** de entrada y salida de cada subproceso.

La siguiente captura muestra un ejemplo del sistema definido en openLCA:

<p align="center">
    <img src="/img/openlca-bridge/captura-openlca.png" alt="Sistema de producto definido en openLCA" width="700"/>
</p>

### 2. Crear la clase del proceso

Crear `src/processes/almendro.py`, reutilizando las funciones de `calculos.py` y los datos de `datos_referencia.py`
siempre que sea posible:

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
            # ... resto de entradas del subproceso en openLCA
        }
        flujos.outputs = {
            AlmendroProcess.fertilizantes_flow_name: 1,
            **calculos.emisiones_fertilizantes(output),
        }
        return flujos

    # get_manejo_cultivo_flow, get_pesticidas_flow y get_sistema_riego_flow siguen el mismo patrón:
    # entradas por tonelada y salida de referencia con su *_flow_name y valor 1.

    @staticmethod
    def get_all_flows(output: CaptureACVOutput):
        return {
            AlmendroProcess.fertilizantes_flow_name: AlmendroProcess.get_fertilizantes_flow(output),
            AlmendroProcess.manejo_cultivo_flow_name: AlmendroProcess.get_manejo_cultivo_flow(output),
            AlmendroProcess.pesticidas_flow_name: AlmendroProcess.get_pesticidas_flow(output),
            AlmendroProcess.sistema_riego_flow_name: AlmendroProcess.get_sistema_riego_flow(output),
        }
```

### 3. Registrar el proceso en `PROCESS_MAP`

Añadir la clase al diccionario `PROCESS_MAP` de `src/services/acv_service.py`, con la clave que envía LCA Capture en
`metadatos.cultivo.tipo`:

```python
PROCESS_MAP = {
    "Tomate": TomateProcess,
    "Olivo": OlivoProcess,
    "Viñedo": VinedoProcess,
    "Almendro": AlmendroProcess,
}
```

### 4. Consideraciones sobre el mapeo de flujos

- **Nombres de flujos**: una clave que no coincide con ningún intercambio no provoca error, pero se ignora (con un
  aviso en el log) y ese intercambio queda a 0. Conviene revisar los avisos al probar el proceso.
- **Nombres de subprocesos**: deben coincidir con los `*_flow_name` y ser únicos entre los proveedores del sistema de
  producto; si no, el cálculo falla con un error de openLCA (HTTP 500).
- **Datos ausentes**: un flujo sin dato vale 0. Los bloques opcionales (`bombeo`, `caseta`, `espalderas`) se tratan en
  las funciones de `calculos.py`, que devuelven 0 cuando el bloque no existe.
- **Quinto subproceso**: si el sistema de producto tiene estructuras permanentes, se añade `estructuras_flow_name` y
  `get_estructuras_flow`, y se incluye en `get_all_flows`, como en `OlivoProcess`.
- **Coeficientes**: `POST /capture-acv-coeficientes` usa los mismos `FlowDict`, por lo que no requiere cambios.

### 5. Añadir tests

Los tests no usan openLCA: el cliente se sustituye por los mocks de `test/mocks.py`. Para el nuevo cultivo:

- Añadir una ficha de prueba en `test/` (por ejemplo, `almendro_input.json`).
- Verificar que `get_all_flows` devuelve los flujos esperados para esa ficha.
- Verificar que `POST /capture-acv` responde **HTTP 200** con el cliente de openLCA simulado.
