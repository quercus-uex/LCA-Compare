import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { StatsController } from './stats.controller';
import type { StatsService } from './stats.service';
import { GlobalStatsQueryDto } from './dto/global-stats-query.dto';

async function parseQuery(query: Record<string, string>) {
  const dto = plainToInstance(GlobalStatsQueryDto, query);
  const errors = await validate(dto, { whitelist: true });
  return { dto, errors: errors.map((e) => e.property) };
}

describe('StatsController', () => {
  let controller: StatsController;
  let statsService: jest.Mocked<Pick<StatsService, 'getGlobalStats'>>;

  beforeEach(() => {
    statsService = {
      getGlobalStats: jest.fn().mockResolvedValue({}),
    };
    controller = new StatsController(statsService as unknown as StatsService);
  });

  it.each([
    [
      { anio: '2024', tipoCultivo: 'trigo' },
      { anio: 2024, tipoCultivo: 'trigo' },
    ],
    [{}, { anio: undefined, tipoCultivo: undefined }],
  ])('forwards the query %p to StatsService', async (query, expected) => {
    const { dto, errors } = await parseQuery(query);
    expect(errors).toEqual([]);

    await controller.getGlobalStats(dto);

    expect(statsService.getGlobalStats).toHaveBeenCalledWith(expected);
  });
});

describe('GlobalStatsQueryDto', () => {
  it('converts the year to a number', async () => {
    const { dto, errors } = await parseQuery({ anio: '2024' });

    expect(errors).toEqual([]);
    expect(dto.anio).toBe(2024);
  });

  it.each(['abc', '2024.5', '1899', '2101'])(
    'rejects the year %s',
    async (anio) => {
      expect((await parseQuery({ anio })).errors).toEqual(['anio']);
    },
  );

  it('trims the crop type and treats a blank one as no filter', async () => {
    expect(
      (await parseQuery({ tipoCultivo: '  trigo ' })).dto.tipoCultivo,
    ).toBe('trigo');

    const blank = await parseQuery({ tipoCultivo: '   ' });
    expect(blank.errors).toEqual([]);
    expect(blank.dto.tipoCultivo).toBeUndefined();
  });
});
