import {
  buildCampaignYearFilter,
  buildCampaignYearRangeFilter,
} from './campaign-year.helper';

describe('buildCampaignYearFilter', () => {
  it('returns a full date range filter for a single year', () => {
    const result = buildCampaignYearFilter(2024);

    expect(result).toEqual({
      fechaInicioCampania: {
        gte: new Date('2024-01-01T00:00:00.000Z'),
        lt: new Date('2025-01-01T00:00:00.000Z'),
      },
    });
  });

  it('returns an empty filter when no year is provided', () => {
    expect(buildCampaignYearFilter()).toEqual({});
    expect(buildCampaignYearFilter(undefined)).toEqual({});
  });
});

describe('buildCampaignYearRangeFilter', () => {
  it('returns an empty filter when no year is provided', () => {
    expect(buildCampaignYearRangeFilter()).toEqual({});
    expect(buildCampaignYearRangeFilter(undefined, undefined)).toEqual({});
  });

  it('builds a closed range when start and end years are provided', () => {
    const result = buildCampaignYearRangeFilter(2023, 2025);

    expect(result).toEqual({
      fechaInicioCampania: {
        gte: new Date('2023-01-01T00:00:00.000Z'),
        lt: new Date('2026-01-01T00:00:00.000Z'),
      },
    });
  });

  it('builds a range with only a start year', () => {
    const result = buildCampaignYearRangeFilter(2024, undefined);

    expect(result).toEqual({
      fechaInicioCampania: {
        gte: new Date('2024-01-01T00:00:00.000Z'),
      },
    });
  });

  it('builds a range with only an end year', () => {
    const result = buildCampaignYearRangeFilter(undefined, 2025);

    expect(result).toEqual({
      fechaInicioCampania: {
        lt: new Date('2026-01-01T00:00:00.000Z'),
      },
    });
  });
});
