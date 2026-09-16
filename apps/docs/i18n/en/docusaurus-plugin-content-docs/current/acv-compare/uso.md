---
sidebar_label: 'Usage'
sidebar_position: 3
---

# Usage

This service receives LCA results calculated by **LCA Bridge** whenever both services are running at the same time. If this is the first time a user performs an LCA calculation, they will receive an email with their access password.

The interface is available in Spanish, English, and Portuguese. You can change the language from the selector in the navigation bar, and your choice is kept between sessions.

<p align="center">
    <img src="/img/acv-compare/correo.png" alt="Welcome email for LCA Compare" width="600"/>
</p>

## View LCA Results for a Plot

To view the plots for your user, sign in, select the profile image, and choose *My plots*.

<p align="center">
    <img src="/img/acv-compare/mis_parcelas.png" alt="My plots" width="600"/>
</p>

<p align="center">
    <img src="/img/acv-compare/mis_parcelas_ruta.png" alt="My plots view" width="600"/>
</p>

From the plot list, you can open the details for each plot, where its SIGPAC identifier, cadastral reference, a map with the plot polygon, and associated crops ordered by campaign are shown. Plots marked by an administrator as **reference plots** are identified with a «Reference» badge next to their name.

<p align="center">
    <img src="/img/acv-compare/parcela_ejemplo.png" alt="Plot example" width="600"/>
</p>

When selecting a crop, LCA results are shown by impact category: fertilizers, crop management, pesticides, irrigation system, and total impact. From this view you can also use **Add to comparison** to open the comparator with that plot preloaded as the Reference or Target set.

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
- Plots (your own plots; requires signing in)
- Location (point selected on a map and radius in meters)
- Crop type
- Campaign year (start or end; from 2020 onwards)
- **Only reference plots**: limits the set to plots marked as reference

This filter can be applied to either set and is combined with the other filters. A **reference plot** is a plot that an administrator has marked as validated data; it should not be confused with the **Reference** set, which is the mandatory set in the comparison.

The **Reference** set is required. If only the reference is specified, the average impact values for the set are shown. If a **Target** set is also specified, the percentage difference between both sets is calculated for each category.

<p align="center">
    <img src="/img/acv-compare/ejemplo_comparativa_acv.png" alt="LCA comparison example" width="800"/>
</p>

### Export Results

Both in the LCA result detail and in the comparator, you can export the data in **JSON** or **CSV** format using the export buttons:

- **JSON**: keeps the full response structure, including metadata and category breakdown.
- **CSV**: generates a semicolon-separated (`;`) file with the impact category breakdown, ready to open in spreadsheets.

In the comparator, the available options are:

- **Export comparison**: exports the results of both sets with the metadata of the applied filters.
- **Export reference**: exports only the values from the reference set.
- **Export target**: exports only the values from the target set.

### Generate Report

You can also generate a detailed comparison report in **PDF** by clicking **Generate report**. The report contains an AI-generated comparison summary, recommendations for the target set, the three impacts with the largest difference, and the full category-by-category comparison breakdown. The report is generated in the language currently active in the interface.

<p align="center">
    <img src="/img/acv-compare/boton_generar_informe.png" alt="Button to generate LCA report" width="400"/>
</p>

<p align="center">
    <img src="/img/acv-compare/informe_acv.png" alt="LCA comparison report example" width="400"/>
</p>

## Administration

If the signed-in user has the administrator role, they are automatically redirected to the administration panel. From there, they can manage users, plots, crops, impact methods, countries, provinces, and towns. The panel includes search, pagination, create, edit, delete, and helpers for selecting related entity identifiers. In addition, the plot management section allows marking or unmarking a plot as a **reference plot**.

<p align="center">
    <img src="/img/acv-compare/panel_admin.png" alt="Administration panel" width="600"/>
</p>

## Global Statistics

The **Statistics** route shows an aggregated view of the results registered in LCA Compare. It allows filtering by year, impact category, crop type, and province, and displays:

- Global KPIs: number of plots, crops and total area, average impact per category, and year-over-year variation of the climate change impact.
- Province and town ranking. Clicking an entry opens the comparator with that province or town preloaded as the Reference set. The town ranking includes a search box that shows the town's position in the ranking.
- Time evolution of impacts, with a trend (sparkline) chart per category.
- Impact profile: a radar chart that allows comparing two provinces or two towns.
- Heat map by province and category; clicking a category name reorders the map by its values.
- Crop distribution and relationship between production and impact.
