---
sidebar_label: 'Introducción'
sidebar_position: 1
---

# Introducción

El sistema está compuesto por tres servicios independientes que trabajan de forma coordinada para ofrecer una solución
completa de cálculo, visualización y comparación del **Análisis de Ciclo de Vida (ACV)** de cultivos agrícolas.

## Servicios

### LCA Capture

**LCA Capture** expone una API para obtener los datos registrados por distintos sensores asociados al cálculo de ACV,
incluyendo **caudalímetro**, **fertilizante** y **tractor**. Estos datos se consultan mediante endpoints autenticados con
JWT y pueden filtrarse por rangos de fechas.

### LCA Bridge

**LCA Bridge** es un microservicio desarrollado en **Python** con **FastAPI** que actúa como puente entre la plataforma
**LCA Capture** y el motor de cálculo de ACV **openLCA** con base de datos en formato **.zolca**. Su responsabilidad es recibir los
datos agronómicos de un cultivo (parcela, tipo de cultivo, insumos, riego, maquinaria, etc.), ejecutar el cálculo de
impacto ambiental delegando en el [servidor IPC de OpenLCA](https://github.com/GreenDelta/olca-ipc-container) y enviar
el resultado estructurado a LCA Compare.

El servicio expone un único endpoint, `POST /capture-acv`, y selecciona automáticamente el proceso de cálculo adecuado
según el tipo de cultivo (`TomateProcess`, `OlivoProcess` o `VinedoProcess`).

### LCA Compare

**LCA Compare** es una aplicación web formada por un **backend NestJS** y un **frontend React** que se encarga de la
persistencia, visualización y comparación de los resultados de ACV generados por LCA Bridge. Entre sus funcionalidades
destacan:

- Gestión de parcelas con integración de **SIGPAC**, **Catastro** y el identificador predial portugués para la
  representación geoespacial.
- Visualización de resultados de ACV desglosados por categoría de impacto (fertilizantes, manejo de cultivo, pesticidas,
  sistema de riego e impacto total).
- Comparador entre dos conjuntos de cultivos con filtros por ubicación, tipo de cultivo, campaña y más.
- Dashboard de estadísticas globales con KPIs, evolución temporal, rankings territoriales y distribución por cultivos.
- Generación de informes en PDF con resumen y recomendaciones asistidas por **IA** (OpenRouter).
- Panel de administración para usuarios, parcelas, cultivos, métodos de impacto y datos territoriales, con autenticación
  JWT.

## Cómo interactúan

**LCA Capture** es un servicio independiente que inicia el flujo enviando los datos del cultivo a **LCA Bridge**. La
comunicación interna entre **LCA Bridge**, **LCA Compare** y **openLCA** se realiza a través de una **red Docker
compartida** (`olca`), lo que permite un flujo de datos desacoplado:

1. **LCA Capture** envía los datos de un cultivo al endpoint `POST /capture-acv` de **LCA Bridge**.
2. **LCA Bridge** ejecuta el cálculo de impacto ambiental en **openLCA** y construye el resultado estructurado.
3. El resultado se envía mediante un `POST /capture` al backend de **LCA Compare**, que lo persiste en la base de datos
   PostgreSQL asociándolo al usuario, parcela y cultivo correspondientes.
4. El usuario puede consultar los resultados, compararlos con otros cultivos y generar informes desde la interfaz web
   de **LCA Compare**.

El envío de resultados de LCA Bridge a LCA Compare se realiza en modo *best-effort*: si LCA Compare no está disponible,
el error se registra en el log sin interrumpir la respuesta al cliente.

## Diagrama de la arquitectura software

<p align="center">
    <img src="/img/arquitectura-general.png" alt="Diagrama de arquitectura software" width="700"/>
</p>
