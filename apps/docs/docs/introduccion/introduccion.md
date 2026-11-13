---
sidebar_label: 'Introducción'
sidebar_position: 1
---

# Introducción

La plataforma calcula, visualiza y compara el **Análisis de Ciclo de Vida (ACV)** de cultivos agrícolas mediante tres
servicios independientes.

## Servicios

### LCA Capture

**LCA Capture** es la plataforma que registra los datos agronómicos de los cultivos. Su API ofrece los datos de los
sensores asociados al cálculo de ACV (**caudalímetro**, **fertilizante** y **tractor**), con autenticación JWT y filtros
por rango de fechas.

### LCA Bridge

**LCA Bridge** es un microservicio en **Python** con **FastAPI** que recibe los datos de un cultivo (parcela, insumos,
riego, maquinaria…), calcula su impacto ambiental con el [servidor IPC de openLCA](https://github.com/GreenDelta/olca-ipc-container)
según el proceso de su tipo de cultivo (tomate, olivo o viñedo) y envía el resultado a LCA-Compare.

### LCA-Compare

**LCA-Compare** es una aplicación web (backend NestJS y frontend React) que guarda los resultados de ACV y permite
consultarlos por parcela y campaña, compararlos entre conjuntos de cultivos, generar informes en PDF y analizarlos en
estadísticas globales o dentro de una organización. Ver [Introducción a LCA-Compare](../acv-compare/introduccion.md).

## Cómo interactúan

LCA Bridge, el servidor IPC de openLCA y LCA-Compare se despliegan con el mismo Docker Compose y se comunican por su red
interna:

1. Los datos de un cultivo llegan a **LCA Bridge** a través de `POST /calc`, la única ruta de LCA Bridge expuesta al
   exterior (protegida con clave de API).
2. **LCA Bridge** calcula el impacto ambiental en **openLCA** y construye el resultado estructurado.
3. LCA Bridge envía el resultado al endpoint `POST /capture` de **LCA-Compare**, que lo guarda en PostgreSQL asociado al
   usuario, la parcela y el cultivo, y crea el usuario y la parcela si no existen.
4. El usuario consulta los resultados, los compara y genera informes desde la interfaz web de **LCA-Compare**.

El envío a LCA-Compare es *best-effort*: si LCA-Compare no está disponible, LCA Bridge registra el error en su log y
responde igualmente al cliente con el resultado.

## Diagrama de la arquitectura software

<p align="center">
    <img src="/img/arquitectura-general.png" alt="Diagrama de arquitectura software" width="700"/>
</p>
