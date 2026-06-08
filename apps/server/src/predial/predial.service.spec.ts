import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { PredialService } from './predial.service';

jest.mock('proj4', () => {
  const mock = jest.fn(
    (_from: string, _to: string, coord: [number, number]) => [
      coord[0] / 111319.49079327357,
      coord[1] / 110540.15577050635,
    ],
  );
  return { __esModule: true, default: mock };
});

import proj4 from 'proj4';

const PREDIAL_URL =
  'https://snic.dgterritorio.gov.pt/geoportal/dgt_snic2/api/app/search/predio/nic';

describe('PredialService', () => {
  let httpService: jest.Mocked<Pick<HttpService, 'get'>>;
  let service: PredialService;

  beforeEach(() => {
    httpService = { get: jest.fn() };
    service = new PredialService(httpService as unknown as HttpService);
    (proj4 as unknown as jest.Mock).mockClear();
  });

  it('requests the predial search endpoint with spaces removed and Referer header', async () => {
    httpService.get.mockReturnValue(
      of({
        data: { wkt_3857: 'POLYGON((0 0,1 0,1 1,0 0))', dico: '050601' },
      } as any),
    );

    await service.getPolygon('05 06 01');

    const calledUrl = new URL(httpService.get.mock.calls[0][0]);
    expect(calledUrl.origin + calledUrl.pathname).toBe(PREDIAL_URL);
    expect(calledUrl.searchParams.get('filter')).toBe('050601');

    const options = httpService.get.mock.calls[0][1] as {
      headers: { Referer: string };
    };
    expect(options.headers.Referer).toBe(
      'https://snic.dgterritorio.gov.pt/visualizadorCadastro',
    );
  });

  it('parses WKT polygon rings, transforms EPSG:3857 to WGS84, and returns a GeoJSON feature', async () => {
    httpService.get.mockReturnValue(
      of({
        data: {
          wkt_3857:
            'POLYGON((-370000 4400000,-369000 4400000,-369000 4401000,-370000 4400000))',
          dico: '050601',
        },
      } as any),
    );

    const result = await service.getPolygon('050601');

    expect(proj4).toHaveBeenCalledWith('EPSG:3857', 'WGS84', expect.any(Array));
    expect(result.type).toBe('Feature');
    expect(result.geometry.type).toBe('Polygon');
    expect(result.geometry.coordinates).toHaveLength(1);
    expect(result.geometry.coordinates[0]).toHaveLength(4);
    expect(result.properties!.provincia).toBe(5);
    expect(result.properties!.poblacion).toBe(6);
  });

  it('extracts provincia and poblacion from dico digits', async () => {
    httpService.get.mockReturnValue(
      of({
        data: { wkt_3857: 'POLYGON((0 0,1 0,1 1,0 0))', dico: '123456' },
      } as any),
    );

    const result = await service.getPolygon('123456');

    expect(result.properties!.provincia).toBe(12);
    expect(result.properties!.poblacion).toBe(34);
  });
});
