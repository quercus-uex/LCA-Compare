## MODIFIED Requirements

### Requirement: Workspace Layout
The repository SHALL be organized as a pnpm workspace with deployable applications under `apps/` and reusable packages under `packages/`.

#### Scenario: Applications are moved into apps directory
- **WHEN** the migration is applied
- **THEN** the existing frontend code is located under `apps/web`, the existing backend code is located under `apps/server`, and the existing docs code is located under `apps/docs`

#### Scenario: Common package provides extracted contracts
- **WHEN** the shared-code extraction is applied
- **THEN** `packages/common` exists as a workspace package containing shared contracts and constants extracted from the existing apps

#### Scenario: Apps depend on common package
- **WHEN** the server or web package builds
- **THEN** each app SHALL resolve shared imports through the `common` workspace package
