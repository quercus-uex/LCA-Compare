import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { PredialService } from './predial.service';

const PREDIAL_URL =
  'https://snic.dgterritorio.gov.pt/geoportal/dgt_snic2/api/app/search/predio/nic';

describe('PredialService', () => {
  let httpService: jest.Mocked<Pick<HttpService, 'get'>>;
  let service: PredialService;

  beforeEach(() => {
    httpService = { get: jest.fn() };
    service = new PredialService(httpService as unknown as HttpService);
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

  it('parses the WKT polygon and transforms it from EPSG:3857 to WGS84', async () => {
    httpService.get.mockReturnValue(
      of({
        data: {
          wkt_3857:
            'POLYGON((-333958.47 4865942.28,-222638.98 4865942.28,-222638.98 5012341.66,-333958.47 4865942.28))',
          dico: '050601',
        },
      } as any),
    );

    const result = await service.getPolygon('050601');

    expect(result.type).toBe('Feature');
    expect(result.geometry.type).toBe('Polygon');
    const lonLat = result.geometry.coordinates.map((ring) =>
      ring.map((position) => position.map((v) => Number(v.toFixed(6)))),
    );
    expect(lonLat).toEqual([
      [
        [-3, 40],
        [-2, 40],
        [-2, 41],
        [-3, 40],
      ],
    ]);
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
