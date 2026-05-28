---
sidebar_label: 'Definición de procesos'
sidebar_position: 5
---

# Definición de procesos en Capture ACV

Los **procesos** son el núcleo del cálculo de ACV en Capture ACV. Cada tipo de cultivo soportado tiene asociado un
proceso que define cómo se mapean los datos agronómicos de DTAgro a los flujos de entrada y salida de openLCA.

Actualmente existen tres procesos implementados:

| Proceso | Tipo de cultivo |
|---|---|
| `TomateProcess` | `"Tomate"` |
| `OlivoProcess` | `"Olivo"` |
| `VinedoProcess` | `"Vinedo"` |

## Arquitectura

Los procesos residen en `src/processes/` y siguen una jerarquía de herencia simple:

```
Process (clase base abstracta)
├── TomateProcess
├── OlivoProcess
└── VinedoProcess
```

El servicio `ACVService` selecciona la clase adecuada mediante `get_process_class()` basándose en el valor de
`metadatos.cultivo.tipo` del JSON de entrada:

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

## Clase base: `Process`

La clase `Process` (`src/processes/process.py`) define la interfaz que todo proceso debe implementar:

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

| Atributo | Descripción |
|---|---|
| `name` | Nombre del proceso. Debe coincidir con el valor de `metadatos.cultivo.tipo` que DTAgro envía en el JSON. |
| `uuid` | UUID del sistema de producto en la base de datos .zolca de openLCA. Es el punto de entrada del cálculo de impacto. |
| `fertilizantes_flow_name` | Nombre del flujo intermedio de fertilizantes en openLCA. |
| `manejo_cultivo_flow_name` | Nombre del flujo intermedio de manejo de cultivo en openLCA. |
| `pesticidas_flow_name` | Nombre del flujo intermedio de pesticidas en openLCA. |
| `sistema_riego_flow_name` | Nombre del flujo intermedio de sistema de riego en openLCA. |

### Métodos estáticos

Cada proceso debe implementar cinco métodos estáticos que reciben el objeto `CaptureACVOutput` (el JSON de entrada
parseado) y devuelven un `FlowDict`:

| Método | Descripción |
|---|---|
| `get_fertilizantes_flow(output)` | Mapea los datos de fertilización a flujos de openLCA. |
| `get_manejo_cultivo_flow(output)` | Mapea las labores agrícolas y uso de suelo a flujos de openLCA. |
| `get_pesticidas_flow(output)` | Mapea los productos fitosanitarios a flujos de openLCA. |
| `get_sistema_riego_flow(output)` | Mapea los componentes del sistema de riego a flujos de openLCA. |
| `get_all_flows(output)` | Devuelve un diccionario con los cuatro flujos anteriores, keyed por sus nombres. |

## Modelo `FlowDict`

`FlowDict` es la estructura que representa un conjunto de flujos de openLCA. Contiene dos diccionarios:

```python
class FlowDict:
    inputs: dict[str, float]    # Flujos de entrada (nombre → cantidad)
    outputs: dict[str, float]   # Flujos de salida (nombre → cantidad)
```

- Las **claves** son los nombres exactos de los flujos tal como están definidos en la base de datos .zolca de openLCA.
- Los **valores** son las cantidades extraídas del JSON de entrada de DTAgro.

### Ejemplo: flujo de fertilizantes en `TomateProcess`

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

Los `inputs` representan los recursos consumidos (fertilizantes, combustible) y los `outputs` las emisiones generadas
(NH₃, N₂O, NO₃, NOₓ). El flujo de salida con el nombre del proceso (`fertilizantes_flow_name`) con valor `1` actúa
como conector con el sistema de producto principal en openLCA.

## Flujo de cálculo

Cuando `ACVService.execute()` recibe una petición, el proceso se utiliza de la siguiente forma:

```
1. get_process_class(tipo)           → Selecciona TomateProcess / OlivoProcess / VinedoProcess
2. process.get_all_flows(output)     → Obtiene los 4 FlowDict (fertilizantes, manejo, pesticidas, riego)
3. update_processes(flows, process)  → Actualiza cada subproceso en openLCA vía OLCAClient (IPC)
4. calculate_impacts(process.uuid)   → Ejecuta el cálculo de impacto sobre el sistema de producto
5. build_final_result()              → Construye el resultado estructurado por categoría
```

Cada subproceso (fertilizantes, manejo de cultivo, pesticidas, sistema de riego) se actualiza de forma independiente
en openLCA antes de ejecutar el cálculo global. Esto permite que los valores de los flujos reflejen los datos reales
del cultivo enviado por DTAgro.

## Cómo añadir un nuevo proceso

Para incorporar soporte para un nuevo tipo de cultivo (por ejemplo, `"Almendro"`), sigue estos pasos:

### 1. Crear el sistema de producto en openLCA

Antes de tocar código, necesitas definir en la base de datos .zolca:

- Un **sistema de producto** para el nuevo cultivo con su UUID correspondiente.
- Cuatro **subprocesos** para las categorías: fertilizantes, manejo de cultivo, pesticidas y sistema de riego.
- Los **flujos** de entrada y salida que conectan los subprocesos con el sistema de producto principal.

Los nombres de los flujos deben coincidir exactamente con los que usarás en el código.

### 2. Crear la clase del proceso

Crea un nuevo archivo en `src/processes/`, por ejemplo `almendro_process.py`:

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

### 3. Registrar el proceso en `get_process_class()`

Añade el nuevo caso en la función de selección de procesos:

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

### 4. Consideraciones sobre el mapeo de flujos

Al implementar los métodos `get_*_flow`, ten en cuenta lo siguiente:

- **Nombres de flujos**: deben coincidir **exactamente** con los definidos en la base de datos .zolca. Un error en el
  nombre hará que openLCA no encuentre el flujo y el cálculo falle.
- **Valores por defecto**: cuando un campo del JSON de entrada puede no estar presente (por ejemplo, si no hay labores
  o maquinaria), usa un valor por defecto de `1` para evitar errores de acceso a índices inexistentes. Observa cómo
  `TomateProcess` protege el acceso a arrays con comprobaciones de longitud:

  ```python
  output.manejo_cultivo.labores[0].fabricacion if len(output.manejo_cultivo.labores) > 0 else 1
  ```

- **Flujos de salida del proceso**: cada subproceso debe tener un output con su `*_flow_name` y valor `1`. Este flujo
  actúa como conector con el sistema de producto principal en openLCA.
- **Campos opcionales**: algunos bloques del JSON como `bombeo` pueden ser `null`. Protege el acceso con comprobaciones:

  ```python
  output.bombeo.potencia if output.bombeo else 1
  ```

### 5. Añadir tests

Crea un fixture de prueba en `test/` con un JSON de ejemplo para el nuevo tipo de cultivo y verifica que:

- `get_process_class("Almendro")` devuelve `AlmendroProcess`.
- Cada método `get_*_flow` devuelve un `FlowDict` con los flujos esperados.
- El endpoint `POST /capture-acv` procesa correctamente el nuevo tipo (devolverá HTTP 500 si openLCA no está
  disponible, pero la validación del esquema debe pasar).
