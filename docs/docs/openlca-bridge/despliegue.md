---
sidebar_label: 'Despliegue'
sidebar_position: 2
---

# Despliegue del servicio

Antes de desplegar el servicio puente entre Ventum ACV y OpenLCA, necesitas tener descargado...
- el repositorio ([https://github.com/quercus-uex/Ventum-OpenLCA-Service](https://github.com/quercus-uex/Ventum-OpenLCA-Service)).
- la base de datos **Ecoinvent** con los procesos necesarios ya definidos.

Una vez descargados ambos componentes, modifica el fichero *docker-compose.yml* para que el volumen montado en el
servicio *openlca-ipc* apunte a la carpeta contenedora de la base de datos **Ecoinvent**, debiéndose llamar la carpeta
raíz de la base de datos **ecoinvent**. A continuación se muestra un gráfico aclaratorio:

<p align="center">
    <img src="/img/openlca-bridge/volumen-olca-ipc.png" alt="Gráfico volumen OpenLCA" width="400"/>
</p>

En el caso de que quieras comunicar este servicio con **ACV Compare**, necesitas crear la red compartida **olca**:

```bash
docker network create olca
```

Una vez hecho esto, podremos desplegar tanto el servidor IPC de OpenLCA como el servicio puente
con Docker Compose:

```bash
docker compose up -d
```

El servicio se desplegará en el puerto **3000**.