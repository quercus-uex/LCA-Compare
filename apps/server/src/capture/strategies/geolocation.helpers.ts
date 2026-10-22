import type { Logger } from '@nestjs/common';
import type { Feature, Polygon } from 'geojson';
import type { Poblacion } from '../../generated/prisma/client';
import type { PoblacionService } from '../../poblacion/poblacion.service';

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isValidPolygon(
  feature: Feature<Polygon> | null | undefined,
): feature is Feature<Polygon> {
  const geometry = feature?.geometry;
  if (geometry?.type !== 'Polygon' || !Array.isArray(geometry.coordinates)) {
    return false;
  }
  return (
    geometry.coordinates.length > 0 &&
    geometry.coordinates.every(
      (ring) =>
        Array.isArray(ring) &&
        ring.length >= 4 &&
        ring.every(
          (position) => position.length >= 2 && position.every(Number.isFinite),
        ),
    )
  );
}

// La geolocalización no debe impedir la ingesta: cualquier fallo devuelve null
export async function resolvePolygonSafely(
  logger: Logger,
  identifier: string,
  fetchPolygon: () => Promise<Feature<Polygon> | null | undefined>,
): Promise<Feature<Polygon> | null> {
  try {
    const polygon = await fetchPolygon();
    if (isValidPolygon(polygon)) return polygon;
    logger.warn(`No valid polygon found for parcela ${identifier}`);
  } catch (error) {
    logger.warn(
      `Polygon lookup failed for parcela ${identifier}: ${errorMessage(error)}`,
    );
  }
  return null;
}

export async function findPoblacionSafely(
  logger: Logger,
  identifier: string,
  poblacionService: PoblacionService,
  provinciaCatastro: number | undefined,
  poblacionCatastro: number | undefined,
  countryCode: string,
): Promise<Poblacion | null> {
  // Sin ambos códigos, Prisma ignoraría el filtro y devolvería otra población
  if (
    !Number.isInteger(provinciaCatastro) ||
    !Number.isInteger(poblacionCatastro)
  ) {
    logger.warn(`Invalid catastro codes for parcela ${identifier}`);
    return null;
  }

  try {
    const poblacion = await poblacionService.findByCatastroIds(
      provinciaCatastro!,
      poblacionCatastro!,
      countryCode,
    );
    if (poblacion) return poblacion;
    logger.warn(`No poblacion found for parcela ${identifier}`);
  } catch (error) {
    logger.warn(
      `Poblacion lookup failed for parcela ${identifier}: ${errorMessage(error)}`,
    );
  }
  return null;
}
