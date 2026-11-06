import type { Logger } from '@nestjs/common';
import type { Feature, Polygon, Position } from 'geojson';
import type { PoblacionService } from '../../poblacion/poblacion.service';
import {
  findPoblacionSafely,
  resolvePolygonSafely,
} from './geolocation.helpers';

const ring: Position[] = [
  [-6.0, 39.0],
  [-6.1, 39.1],
  [-6.2, 39.0],
  [-6.0, 39.0],
];

const feature = (geometry: unknown): Feature<Polygon> =>
  ({ type: 'Feature', geometry, properties: {} }) as Feature<Polygon>;

describe('geolocation helpers', () => {
  let logger: { warn: jest.Mock };

  beforeEach(() => {
    logger = { warn: jest.fn() };
  });

  describe('resolvePolygonSafely', () => {
    const resolve = (polygon: Feature<Polygon> | null | undefined) =>
      resolvePolygonSafely(logger as unknown as Logger, 'P1', () =>
        Promise.resolve(polygon),
      );

    it('returns a valid polygon', async () => {
      const polygon = feature({ type: 'Polygon', coordinates: [ring] });

      await expect(resolve(polygon)).resolves.toBe(polygon);
      expect(logger.warn).not.toHaveBeenCalled();
    });

    it.each([
      ['undefined', undefined],
      ['null', null],
      [
        'a non-polygon geometry',
        feature({ type: 'Point', coordinates: [0, 0] }),
      ],
      ['no rings', feature({ type: 'Polygon', coordinates: [] })],
      [
        'a ring with fewer than 4 points',
        feature({ type: 'Polygon', coordinates: [ring.slice(0, 3)] }),
      ],
      [
        'non-finite coordinates',
        feature({
          type: 'Polygon',
          coordinates: [[...ring.slice(0, 3), [Number.NaN, 39.0]]],
        }),
      ],
    ])('returns null and warns for %s', async (_label, polygon) => {
      await expect(resolve(polygon)).resolves.toBeNull();
      expect(logger.warn).toHaveBeenCalledWith(
        'No valid polygon found for parcela P1',
      );
    });

    it('returns null and warns when the lookup throws', async () => {
      await expect(
        resolvePolygonSafely(logger as unknown as Logger, 'P1', () =>
          Promise.reject(new Error('Request failed')),
        ),
      ).resolves.toBeNull();
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Request failed'),
      );
    });
  });

  describe('findPoblacionSafely', () => {
    let poblacionService: { findByCatastroIds: jest.Mock };

    beforeEach(() => {
      poblacionService = { findByCatastroIds: jest.fn() };
    });

    const find = (
      provincia: number | undefined,
      poblacion: number | undefined,
    ) =>
      findPoblacionSafely(
        logger as unknown as Logger,
        'P1',
        poblacionService as unknown as PoblacionService,
        provincia,
        poblacion,
        'ES',
      );

    it('returns the poblacion found by its catastro codes', async () => {
      const poblacion = { id: 'pop1' };
      poblacionService.findByCatastroIds.mockResolvedValue(poblacion);

      await expect(find(41, 91)).resolves.toBe(poblacion);
      expect(poblacionService.findByCatastroIds).toHaveBeenCalledWith(
        41,
        91,
        'ES',
      );
    });

    it.each([
      [undefined, 91],
      [41, undefined],
      [Number.NaN, 91],
    ])(
      'skips the lookup for invalid codes (%p, %p)',
      async (provincia, poblacion) => {
        await expect(find(provincia, poblacion)).resolves.toBeNull();
        expect(poblacionService.findByCatastroIds).not.toHaveBeenCalled();
      },
    );

    it('returns null and warns when no poblacion is found', async () => {
      poblacionService.findByCatastroIds.mockResolvedValue(null);

      await expect(find(41, 91)).resolves.toBeNull();
      expect(logger.warn).toHaveBeenCalledWith(
        'No poblacion found for parcela P1',
      );
    });

    it('returns null and warns when the lookup throws', async () => {
      poblacionService.findByCatastroIds.mockRejectedValue(
        new Error('DB down'),
      );

      await expect(find(41, 91)).resolves.toBeNull();
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('DB down'),
      );
    });
  });
});
