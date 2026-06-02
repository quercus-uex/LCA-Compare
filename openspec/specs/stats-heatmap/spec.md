## ADDED Requirements

### Requirement: Heatmap of provinces vs EF 3.1 categories
The dashboard SHALL display a heatmap where rows are provinces and columns are the 8 EF 3.1 categories, with cell color intensity proportional to the impact value.

#### Scenario: Render heatmap with top provinces
- **WHEN** province ranking data is available
- **THEN** a heatmap SHALL render showing the top 15 provinces by total impact as rows, with 8 columns (one per EF 3.1 category), where each cell's background color intensity represents the mean impact value for that province-category combination

#### Scenario: Color scale
- **WHEN** the heatmap renders
- **THEN** cells SHALL use a sequential color scale from light gray (lowest impact in that column) to the category's semantic color at full saturation (highest impact in that column), making high-impact combinations visually prominent

#### Scenario: Hover tooltip
- **WHEN** user hovers over a heatmap cell
- **THEN** a tooltip SHALL display the province name, category name (Spanish), and the numeric impact value with its unit

#### Scenario: Sort heatmap rows
- **WHEN** user clicks a category column header
- **THEN** the heatmap SHALL re-sort provinces by that category's value in descending order

#### Scenario: Heatmap with no data
- **WHEN** province data is empty
- **THEN** the heatmap SHALL display a "No hay datos disponibles" message

#### Scenario: Responsive heatmap
- **WHEN** viewport width is below 1024px
- **THEN** the heatmap SHALL scroll horizontally with the first column (province name) sticky on the left
