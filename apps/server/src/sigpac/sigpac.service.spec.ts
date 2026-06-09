import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { SigpacService } from './sigpac.service';

const SIGPAC_BASE_URL =
  'https://sigpac-hubcloud.es/ogcapi/collections/recintos/items';

describe('SigpacService', () => {
  let httpService: jest.Mocked<Pick<HttpService, 'get'>>;
  let service: SigpacService;

  beforeEach(() => {
    httpService = { get: jest.fn() };
    service = new SigpacService(httpService as unknown as HttpService);
  });

  it('requests the recintos items endpoint with expected query parameters', async () => {
    const feature = {
      type: 'Feature' as const,
      id: 1,
      properties: {
        dn_pk: 1,
        provincia: 28,
        municipio: 1,
        agregado: 1,
        zona: 1,
        poligono: 1,
        parcela: 1,
        recinto: 1,
        pendiente_media: 0,
        altitud: 600,
      },
      geometry: { type: 'Polygon' as const, coordinates: [[[0, 0]]] },
    };
    httpService.get.mockReturnValue(
      of({
        data: {
          type: 'FeatureCollection',
          features: [feature],
          numberMatched: 1,
          numberReturned: 1,
        },
      } as any),
    );

    await service.getPolygon({
      provincia: 28,
      municipio: 1,
      parcela: 1,
      poligono: 1,
    });

    const calledUrl = new URL(httpService.get.mock.calls[0][0]);
    expect(calledUrl.origin + calledUrl.pathname).toBe(SIGPAC_BASE_URL);
    expect(calledUrl.searchParams.get('f')).toBe('json');
    expect(calledUrl.searchParams.get('limit')).toBe('1');
    expect(calledUrl.searchParams.get('provincia')).toBe('28');
    expect(calledUrl.searchParams.get('municipio')).toBe('1');
    expect(calledUrl.searchParams.get('parcela')).toBe('1');
    expect(calledUrl.searchParams.get('poligono')).toBe('1');
  });

  it('returns the first feature from the SIGPAC response unchanged', async () => {
    const feature = {
      type: 'Feature' as const,
      id: 42,
      properties: {
        dn_pk: 42,
        provincia: 28,
        municipio: 5,
        agregado: 2,
        zona: 3,
        poligono: 1,
        parcela: 10,
        recinto: 2,
        pendiente_media: 5.5,
        altitud: 700,
      },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [
          [
            [-3.7, 40.4],
            [-3.7, 40.5],
            [-3.6, 40.5],
            [-3.7, 40.4],
          ],
        ],
      },
    };
    httpService.get.mockReturnValue(
      of({
        data: {
          type: 'FeatureCollection',
          features: [feature],
          numberMatched: 1,
          numberReturned: 1,
        },
      } as any),
    );

    const result = await service.getPolygon({
      provincia: 28,
      municipio: 5,
      parcela: 10,
      poligono: 1,
    });

    expect(result).toBe(feature);
  });

  it('sends empty query values for omitted optional SIGPAC identifiers', async () => {
    httpService.get.mockReturnValue(
      of({
        data: {
          type: 'FeatureCollection',
          features: [undefined],
          numberMatched: 0,
          numberReturned: 0,
        },
      } as any),
    );

    await service.getPolygon({});

    const calledUrl = new URL(httpService.get.mock.calls[0][0]);
    expect(calledUrl.searchParams.get('provincia')).toBe('');
    expect(calledUrl.searchParams.get('municipio')).toBe('');
    expect(calledUrl.searchParams.get('parcela')).toBe('');
    expect(calledUrl.searchParams.get('poligono')).toBe('');
  });

  it('propagates HTTP errors from the SIGPAC API call', async () => {
    const error = new Error('SIGPAC unavailable');
    httpService.get.mockReturnValue(throwError(() => error));

    await expect(service.getPolygon({ provincia: 28 })).rejects.toThrow(error);
  });
});
