---
sidebar_label: 'Usage'
sidebar_position: 3
---

# Usage

LCA Compare receives the LCA results calculated by **LCA Bridge**. When a user's first calculation arrives, their account is created and, if email sending is configured, they receive an email with their access password. There is no public sign-up: all other accounts are created by an administrator.

<p align="center">
    <img src="/img/acv-compare/correo.png" alt="Welcome email for LCA Compare" width="600"/>
</p>

The interface is available in Spanish, English, and Portuguese. You can change the language from the selector in the navigation bar, and your choice is kept between sessions.

## View LCA Results for a Plot

To view the plots for your user, sign in and select *My plots* in the navigation bar (on narrow screens, inside the ☰ menu).

<p align="center">
    <img src="/img/acv-compare/mis_parcelas.png" alt="My plots" width="600"/>
</p>

<p align="center">
    <img src="/img/acv-compare/mis_parcelas_ruta.png" alt="My plots view" width="600"/>
</p>

The list shows each plot with its town, current crop, area and number of campaigns. You can search by name, identifier (SIGPAC, cadastral reference or Portuguese land ID) or town, filter by current crop, by town or by reference plots only, and sort by name, latest campaign or area. Plots can be shown as cards, as a table or on a map, where each one is colored by its current crop. The search, filters and view are kept in the page address, so they are preserved when you come back from a plot's details.

Opening a plot shows a map with its polygon (with a streets or satellite layer), its town, its identifiers, the data of its current crop and the history of all its campaigns. If the plot has more than one campaign, a chart shows how production, yield, water consumption or the total impact of any EF 3.1 category evolves. **Compare this plot** opens the comparator with the plot preloaded as the target or reference set. Plots marked by an administrator as **reference plots** are identified with a «Reference» badge next to their name. If the plot's location could not be determined when it was ingested, «Location not available» is shown instead of the map; those plots do not appear in the list's map view or in the comparator's geographic location filters.

<p align="center">
    <img src="/img/acv-compare/parcela_ejemplo.png" alt="Plot example" width="600"/>
</p>

Clicking **View impacts** on the current crop or on any campaign in the history shows the LCA results of that campaign: the total impact of each category and a bar with its share across fertilizers, crop management, pesticides and irrigation system. On wide screens the table also shows the value of each stage; the full breakdown is always included in the export. From this view you can also export the result as JSON or CSV and use **Compare this plot**.

<p align="center">
    <img src="/img/acv-compare/acv_parcela.png" alt="LCA for a plot" width="600"/>
</p>

## LCA Comparator

The comparator opens from **Compare** in the navigation bar.

<p align="center">
    <img src="/img/acv-compare/boton_comparador.png" alt="Compare button in the navigation bar" width="600"/>
</p>

Compare two crop sets, each defined by these filters:

- Country
- Province
- Town
- Plots (your own plots; requires signing in)
- Location (point selected on a map and radius in meters; includes every campaign of the plots within the radius)
- Crop type
- Season (start or end year; from 2020 onwards)
- **Only reference plots**: limits the set to plots marked as reference
- **Organization**: limits the set to the campaigns that the members of your organization have consented to (only shown if you manage one; see [Organizations](#organizations))

The reference plots filter can be applied to either set and is combined with the other filters. A **reference plot** is a plot that an administrator has marked as validated data; it should not be confused with the **Reference** set, which is the mandatory set in the comparison.

The **Reference** set is required. If only the reference is specified, the average impact values for the set are shown. If a **Target** set is also specified, the percentage difference of the target relative to the reference is calculated for each category.

Values are per kg of product. Each set's value is the **simple mean** of its campaigns: every campaign counts the same, without weighting by production or area. Each category is averaged only over the campaigns that include it, so a category missing from a campaign does not count as 0.

The **Reference** always acts as the baseline and the **Target** is the set being evaluated against it:

```
Difference (%) = (target − reference) / |reference| × 100
```

- A **positive** value (in red) means the target has a **higher** impact than the reference. For example, +20 % means the target's impact is 20 % above the reference.
- A **negative** value (in green) means the target has a **lower** impact than the reference.
- **n/a** is shown when the reference value is 0 or the category has no data in the target.

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

**Generate report** creates a **PDF** report of the comparison. It contains an AI-generated comparison summary, recommendations for the target set, the three impacts with the largest difference, and the full category-by-category comparison breakdown. The report is generated in the language currently active in the interface.

<p align="center">
    <img src="/img/acv-compare/boton_generar_informe.png" alt="Button to generate LCA report" width="400"/>
</p>

<p align="center">
    <img src="/img/acv-compare/informe_acv.png" alt="Example of an LCA PDF report" width="400"/>
</p>

## Administration

If the signed-in user has the administrator role, they are automatically redirected to the administration panel. The side menu groups the sections into **Data** (users, plots and crops) and **Catalogs** (impact methods, countries, provinces and towns), with the number of records in each one. Each section allows searching, paginating, creating, editing and deleting records. Related records (owner, town, plot...) are shown by name, are chosen with a search box and, when clicked, open their section filtered by that record. The section and the filters are kept in the page address, so they can be reloaded or shared.

The plot management section allows marking or unmarking a plot as a **reference plot** and assigning a town to plots that have none: the panel shows how many there are and lets you filter them with **Only without town**. A plot without a town does not appear in the comparator's country, province or town filters.

When deleting:

- a plot, its crops and their impact results are also deleted;
- a crop, its impact result is also deleted;
- a user with plots, a country with provinces, a province with towns, a town with plots or an impact method with results, the panel prevents it and explains why.

An administrator cannot delete their own account or remove their own administrator role. A user who manages organizations cannot be deleted either: those organizations must be transferred or deleted first.

The **Data** group also includes **organizations**, which can be viewed and deleted (they are created and edited from the application), and **consents**, read-only, with their organization, user, campaign and status.

<p align="center">
    <img src="/img/acv-compare/panel_admin.png" alt="Administration panel" width="600"/>
</p>

## Global Statistics

The **Statistics** route shows an aggregated view of the results registered in LCA Compare. It allows filtering by impact category, crop type, and year (and by organization, if you manage one), and displays:

- Global KPIs: number of plots, crops and total area, average impact per category, and year-over-year variation of each category. The year-over-year variation compares only the plots with a result in both the selected year and the previous one (at least 3), so farms joining or leaving do not affect it.
- Province and town ranking. Clicking an entry opens the comparator with that province or town preloaded as the Reference set. The town ranking can be limited to a province and includes a search box that shows each town's position.
- Time evolution of impacts, with a trend (sparkline) chart per category.
- Impact profile: a radar chart that allows comparing two provinces or two towns.
- Heat map by province and category; clicking a category name reorders the map by its values.
- Crop distribution and relationship between production and impact.

Human toxicity is shown as two categories, cancer and non-cancer, as in EF 3.1. Water allocation (m³/ha) and water productivity (kg/m³) use only irrigated crops (water consumption above 0); yield (kg/ha) includes all of them.

## Organizations

An organization lets you analyze the campaigns of several users together. Any signed-in user can create organizations from **Organizations** in the navigation bar, and whoever creates one is its only administrator.

The administrator asks other users for access from the **Request access** tab of the organization's panel, entering the email of an already registered user and the campaigns (years, from 2020 to the one after the current year) they want to access. Consent is given per user and per campaign.

The user receives the request in the navigation bar notifications (bell icon) and, if email sending is configured, also by email. From there they accept or reject each campaign, or all of them at once. **An accepted campaign can only be revoked by the organization's administrator**: the user cannot withdraw it or leave the organization. If they reject a campaign, the administrator can request it again.

With an accepted campaign, the administrator can:

- View the member's plots (**View plots** in the **Members** tab), with their map, crops and LCA results, but only for the accepted campaigns.
- Use the organization as a filter in the [comparator](#lca-comparator) and in the [statistics](#global-statistics). The filter only includes the crops of the campaigns accepted by members and of those contributed by the administrator.

The administrator can also contribute their own plots: under **My campaigns**, in the **Members** tab, they select the campaigns they want to include and deselect them to withdraw them. No request or acceptance is needed, and those campaigns count like those of any member. If they transfer the administration, they remain a member with the campaigns they were contributing.

In the **Members** tab the administrator sees the status of each campaign (pending, accepted, rejected or revoked), and can cancel a pending request, revoke an accepted campaign or remove a member, which revokes all their campaigns. In **Settings** they can change the name and description, transfer the administration to a member with at least one accepted campaign, or delete the organization. The affected user is notified of every revocation, removal, transfer or deletion.

In **Organizations**, each user also sees the organizations they are a member of, who manages them and which campaigns they have granted, with their status.
