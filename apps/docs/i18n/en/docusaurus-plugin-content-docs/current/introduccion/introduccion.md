---
sidebar_label: 'Introduction'
sidebar_position: 1
---

# Introduction

The platform calculates, visualizes, and compares the **Life Cycle Assessment (LCA)** of agricultural crops through three independent services.

## Services

### LCA Capture

**LCA Capture** is the platform that records the agronomic data of crops. Its API provides the data from the sensors associated with LCA calculation (**flowmeter**, **fertilizer**, and **tractor**), with JWT authentication and date range filters.

### LCA Bridge

**LCA Bridge** is a **Python** microservice built with **FastAPI** that receives a crop's data (plot, inputs, irrigation, machinery…), calculates its environmental impact with the [openLCA IPC server](https://github.com/GreenDelta/olca-ipc-container) using the process for its crop type (tomato, olive, or vineyard), and sends the result to LCA-Compare.

### LCA-Compare

**LCA-Compare** is a web application (NestJS backend and React frontend) that stores LCA results and lets users view them by plot and campaign, compare them across crop sets, generate PDF reports, and analyze them in global statistics or within an organization. See [Introduction to LCA-Compare](../acv-compare/introduccion.md).

## How They Interact

LCA Bridge, the openLCA IPC server, and LCA-Compare are deployed with the same Docker Compose file and communicate through its internal network:

1. A crop's data reaches **LCA Bridge** through `POST /calc`, the only LCA Bridge route exposed externally (protected with an API key).
2. **LCA Bridge** calculates the environmental impact in **openLCA** and builds the structured result.
3. LCA Bridge sends the result to the **LCA-Compare** `POST /capture` endpoint, which stores it in PostgreSQL linked to the user, plot, and crop, and creates the user and the plot if they do not exist.
4. The user views the results, compares them, and generates reports from the **LCA-Compare** web interface.

Delivery to LCA-Compare is *best-effort*: if LCA-Compare is not available, LCA Bridge logs the error and still responds to the client with the result.

## Software Architecture Diagram

<p align="center">
    <img src="/img/arquitectura-general.png" alt="Software architecture diagram" width="700"/>
</p>
