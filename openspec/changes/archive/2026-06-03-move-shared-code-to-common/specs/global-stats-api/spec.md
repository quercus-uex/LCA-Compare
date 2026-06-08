## ADDED Requirements

### Requirement: Shared global stats response contract
The system SHALL define the `GlobalStatsDto` response shape and nested statistics item shapes in `packages/common` and use those shared contracts across server and web code.

#### Scenario: Stats endpoint keeps response shape
- **WHEN** a client requests `GET /stats/global`
- **THEN** the returned JSON fields SHALL remain compatible with the existing `GlobalStatsDto` shape while the TypeScript contract is sourced from `packages/common`

#### Scenario: Stats frontend consumes shared shape
- **WHEN** the frontend stats hook stores or returns global statistics data
- **THEN** it SHALL type that data using the shared `GlobalStatsDto` contract from `packages/common`

#### Scenario: Stats backend aligns DTOs with shared shape
- **WHEN** backend stats DTO classes are maintained for Swagger metadata
- **THEN** their fields SHALL remain aligned with the shared global stats contracts from `packages/common`
