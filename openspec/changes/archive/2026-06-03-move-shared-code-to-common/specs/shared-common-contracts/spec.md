## ADDED Requirements

### Requirement: Shared common package exports
The system SHALL expose shared TypeScript contracts and plain constants from `packages/common` for data shapes and domain values consumed by both `apps/server` and `apps/web`.

#### Scenario: Apps import shared contracts
- **WHEN** server or web code needs a shared API payload type or shared domain constant
- **THEN** it SHALL import that contract or constant from the `common` workspace package rather than redefining the same shape locally

#### Scenario: Common remains framework-neutral
- **WHEN** `packages/common` is built or imported
- **THEN** it SHALL NOT require React, NestJS, Prisma, browser-only APIs, server-only APIs, validation decorators, or Swagger decorators

### Requirement: Shared EF category metadata
The system SHALL define EF impact category metadata once in `packages/common`, including each category's identifier, English matching names, Spanish display name, unit, and display color.

#### Scenario: Server aggregates by shared category metadata
- **WHEN** backend aggregation or comparison logic matches EF impact JSON categories
- **THEN** it SHALL use shared category identifiers and English matching names from `packages/common`

#### Scenario: Web displays shared category metadata
- **WHEN** frontend charts, selectors, or rankings display EF impact categories
- **THEN** they SHALL use shared Spanish names, units, colors, and identifiers from `packages/common`

### Requirement: Shared API response and domain contracts
The system SHALL define shared API response envelope types and DTO-shaped contracts for stats, compare, location entities, parcel/crop entities, users, authentication responses, and impact result data.

#### Scenario: Frontend consumes API payload types
- **WHEN** frontend hooks parse JSON returned by backend endpoints
- **THEN** the parsed payloads SHALL be typed with shared contracts from `packages/common`

#### Scenario: Backend exposes API payload shapes
- **WHEN** backend DTOs or services describe returned API data
- **THEN** they SHALL align with the shared contracts from `packages/common` while retaining app-local runtime decorators where required

### Requirement: One-way dependency boundary
The system SHALL maintain a one-way dependency boundary where app packages depend on `packages/common`, and `packages/common` does not depend on app packages.

#### Scenario: Common imports are inspected
- **WHEN** common source files are reviewed or built
- **THEN** no source file in `packages/common` SHALL import from `apps/server`, `apps/web`, generated Prisma clients, React modules, or Nest modules
