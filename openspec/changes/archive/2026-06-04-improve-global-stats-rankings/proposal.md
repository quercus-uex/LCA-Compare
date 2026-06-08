## Why

The global statistics rankings currently show category-filtered values without making the selected category unit explicit, which makes values harder to interpret when switching between EF 3.1 categories. Province and population rankings are also dead ends: users who identify an interesting location must manually go to the comparator and select it again.

## What Changes

- Display the selected EF 3.1 category unit next to ranking impact values in province and population ranking entries.
- Preserve existing ranking behavior, sorting, best/worst splitting, search, and province filtering while adding unit labels.
- Make province ranking entries clickable so selecting a province navigates to the comparator with that province preselected as the reference.
- Make population ranking entries clickable so selecting a population navigates to the comparator with that population preselected as the reference.
- Keep the interaction scoped to the frontend; no API shape changes are expected.

## Capabilities

### New Capabilities


### Modified Capabilities
- `statistics-dashboard`: Rankings must display the selected category unit and support direct navigation from province/population entries to the comparator with the clicked location preselected as reference.

## Impact

- Affected frontend code: global statistics dashboard ranking components and comparator routing/preselection behavior in `apps/web`.
- Affected shared data: EF category metadata unit lookup from existing common category definitions.
- No expected backend API, database, dependency, or migration changes.
