import { ForbiddenException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { StatsController } from './stats.controller';
import type { StatsService } from './stats.service';
import { GlobalStatsQueryDto } from './dto/global-stats-query.dto';
import type { OrganizacionAccesoService } from '../organizacion/organizacion-acceso.service';

const ORG_ID = '11111111-1111-4111-8111-111111111111';

async function parseQuery(query: Record<string, string>) {
  const dto = plainToInstance(GlobalStatsQueryDto, query);
  const errors = await validate(dto, { whitelist: true });
  return { dto, errors: errors.map((e) => e.property) };
}

describe('StatsController', () => {
  let controller: StatsController;
  let statsService: jest.Mocked<Pick<StatsService, 'getGlobalStats'>>;
  let accesoService: jest.Mocked<
    Pick<OrganizacionAccesoService, 'getOrganizacionAdministrada'>
  >;

  beforeEach(() => {
    statsService = {
      getGlobalStats: jest.fn().mockResolvedValue({}),
    };
    accesoService = { getOrganizacionAdministrada: jest.fn() };
    controller = new StatsController(
      statsService as unknown as StatsService,
      accesoService as unknown as OrganizacionAccesoService,
    );
  });

  it.each([
    [
      { anio: '2024', tipoCultivo: 'trigo' },
      { anio: 2024, tipoCultivo: 'trigo', idOrganizacion: undefined },
    ],
    [
      {},
      { anio: undefined, tipoCultivo: undefined, idOrganizacion: undefined },
    ],
  ])('forwards the query %p to StatsService', async (query, expected) => {
    const { dto, errors } = await parseQuery(query);
    expect(errors).toEqual([]);

    await controller.getGlobalStats(dto);

    expect(statsService.getGlobalStats).toHaveBeenCalledWith(expected);
    expect(accesoService.getOrganizacionAdministrada).not.toHaveBeenCalled();
  });

  it('forwards the organization once the requester is checked as its administrator', async () => {
    const user = { sub: 'u1', email: 'u1@example.com' };

    await controller.getGlobalStats({ idOrganizacion: ORG_ID }, user);

    expect(accesoService.getOrganizacionAdministrada).toHaveBeenCalledWith(
      ORG_ID,
      'u1',
    );
    expect(statsService.getGlobalStats).toHaveBeenCalledWith({
      anio: undefined,
      tipoCultivo: undefined,
      idOrganizacion: ORG_ID,
    });
  });

  it.each([
    ['an anonymous requester', undefined],
    ['a user who does not administer it', { sub: 'u2', email: 'u2@x.com' }],
  ])('rejects the organization filter for %s with 403', async (_name, user) => {
    const forbidden = new ForbiddenException(
      'No eres el administrador de esta organización',
    );
    accesoService.getOrganizacionAdministrada.mockRejectedValue(forbidden);

    await expect(
      controller.getGlobalStats({ idOrganizacion: ORG_ID }, user),
    ).rejects.toStrictEqual(forbidden);
    expect(accesoService.getOrganizacionAdministrada).toHaveBeenCalledWith(
      ORG_ID,
      user?.sub,
    );
    expect(statsService.getGlobalStats).not.toHaveBeenCalled();
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

  it.each([
    [{ idOrganizacion: ORG_ID }, []],
    [{ idOrganizacion: 'not-a-uuid' }, ['idOrganizacion']],
  ])('validates the organization id %p', async (query, errors) => {
    expect((await parseQuery(query)).errors).toEqual(errors);
  });

  it('trims the crop type and treats a blank one as no filter', async () => {
    expect(
      (await parseQuery({ tipoCultivo: '  trigo ' })).dto.tipoCultivo,
    ).toBe('trigo');

    const blank = await parseQuery({ tipoCultivo: '   ' });
    expect(blank.errors).toEqual([]);
    expect(blank.dto.tipoCultivo).toBeUndefined();
  });
});
