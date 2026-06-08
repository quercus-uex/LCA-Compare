## MODIFIED Requirements

### Requirement: Heatmap of provinces vs EF 3.1 categories
The dashboard SHALL display a heatmap where rows are provinces and columns are the 8 EF 3.1 categories, with cell color intensity proportional to the impact value, stable React list rendering, and fluid sizing within its card.

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
- **WHEN** the heatmap renders inside the dashboard card
- **THEN** the heatmap SHALL adapt to the available card width without overflowing the page horizontally

#### Scenario: Category headers use two lines
- **WHEN** EF 3.1 category names are displayed in the heatmap header row
- **THEN** each category header SHALL be allowed to wrap to up to two lines before being clipped

#### Scenario: Stable row rendering
- **WHEN** the heatmap renders province rows and category cells
- **THEN** each rendered row group SHALL have a stable key based on the province identifier so React does not emit list-key warnings

#### Scenario: Heatmap helper maintainability
- **WHEN** heatmap numeric formatting or cell color calculation is changed
- **THEN** the implementation SHALL keep those helper concerns isolated from the row rendering markup
