---
sidebar_label: 'Usage'
sidebar_position: 3
---

# Usage

This service receives LCA results calculated by **Capture ACV** whenever both services are running at the same time. If this is the first time a user performs an LCA calculation, they will receive an email with their access password.

<p align="center">
    <img src="/img/acv-compare/correo.png" alt="Welcome email for ACV Compare" width="600"/>
</p>

## View LCA Results for a Plot

To view the plots for your user, sign in, select the profile image, and choose *My plots*.

<p align="center">
    <img src="/img/acv-compare/mis_parcelas.png" alt="My plots" width="600"/>
</p>

<p align="center">
    <img src="/img/acv-compare/mis_parcelas_ruta.png" alt="My plots view" width="600"/>
</p>

From the plot list, you can open the details for each plot, where its SIGPAC identifier, cadastral reference, a map with the plot polygon, and associated crops ordered by campaign are shown.

<p align="center">
    <img src="/img/acv-compare/parcela_ejemplo.png" alt="Plot example" width="600"/>
</p>

When selecting a crop, LCA results are shown by impact category: fertilizers, crop management, pesticides, irrigation system, and total impact.

<p align="center">
    <img src="/img/acv-compare/acv_parcela.png" alt="LCA for a plot" width="600"/>
</p>

## LCA Comparator

The LCA comparator is accessed from the dedicated button in the navigation bar.

<p align="center">
    <img src="/img/acv-compare/boton_comparador.png" alt="LCA comparator button" width="600"/>
</p>

There, you can compare two crop sets, filtering by:

- Country
- Province
- Town
- Location (coordinates and radius in kilometers)
- Crop type
- Campaign year (start or end)

The **Reference** set is required. If only the reference is specified, the average impact values for the set are shown. If a **Target** set is also specified, the percentage difference between both sets is calculated for each category.

<p align="center">
    <img src="/img/acv-compare/ejemplo_comparativa_acv.png" alt="LCA comparison example" width="800"/>
</p>

### Export Results

After running the comparison, you can export the results in **JSON** format with the export buttons:

- **Export comparison**: exports the results of both sets with the metadata of the applied filters.
- **Export reference**: exports only the values from the reference set.
- **Export target**: exports only the values from the target set.

### Generate Report

You can also generate a detailed comparison report in **PDF** by clicking **Generate report**. The report contains an AI-generated comparison summary, recommendations for the target set, the three impacts with the largest difference, and the full category-by-category comparison breakdown.

<p align="center">
    <img src="/img/acv-compare/boton_generar_informe.png" alt="Button to generate LCA report" width="400"/>
</p>

<p align="center">
    <img src="/img/acv-compare/informe_acv.png" alt="LCA comparison report example" width="400"/>
</p>

## Administration

If the signed-in user has the administrator role, they are automatically redirected to the administration panel. From there, they can manage users, plots, crops, impact methods, countries, provinces, and towns. The panel includes search, pagination, create, edit, delete, and helpers for selecting related entity identifiers.

<p align="center">
    <img src="/img/acv-compare/panel_admin.png" alt="Administration panel" width="600"/>
</p>

## Global Statistics

The **Statistics** route shows an aggregated view of the results registered in ACV Compare. It allows filtering by year, impact category, crop type, and province, and displays:

- Global KPIs for crops, plots, users, area, production, water, and average impact.
- Province and town ranking.
- Time evolution of impacts.
- Impact profile, heat map, crop distribution, and relationship between production and impact.
