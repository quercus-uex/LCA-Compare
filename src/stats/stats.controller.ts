import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { StatsService } from './stats.service';
import { GlobalStatsDto } from './dto/global-stats.dto';
import { ApiTags } from '@nestjs/swagger';
import { EF_CATEGORIES, type EfCategoryId } from '../compare/compare.types';

const VALID_CATEGORY_IDS = EF_CATEGORIES.map((c) => c.id);
const MIN_SUPPORTED_YEAR = 1900;
const MAX_SUPPORTED_YEAR = 2100;

function normalizeOptionalString(value?: string): string | undefined {
  if (value === undefined || value.trim() === '') {
    return undefined;
  }
  return value;
}

function parseOptionalYear(value?: string): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!/^\d+$/.test(value)) {
    throw new BadRequestException(
      'anio debe ser un año entero válido en formato numérico',
    );
  }

  const parsed = Number(value);
  if (parsed < MIN_SUPPORTED_YEAR || parsed > MAX_SUPPORTED_YEAR) {
    throw new BadRequestException(
      `anio está fuera del rango soportado (${MIN_SUPPORTED_YEAR}-${MAX_SUPPORTED_YEAR})`,
    );
  }

  return parsed;
}

@ApiTags('stats')
@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('global')
  getGlobalStats(
    @Query('anio') anio?: string,
    @Query('categoria') categoria?: string,
    @Query('tipoCultivo') tipoCultivo?: string,
    @Query('idProvinciaPoblacion') idProvinciaPoblacion?: string,
  ): Promise<GlobalStatsDto> {
    const parsedAnio = parseOptionalYear(anio);
    const normalizedCategoria = normalizeOptionalString(categoria);
    const normalizedTipoCultivo = normalizeOptionalString(tipoCultivo);
    const normalizedIdProvinciaPoblacion =
      normalizeOptionalString(idProvinciaPoblacion);

    if (normalizedCategoria !== undefined) {
      if (!VALID_CATEGORY_IDS.includes(normalizedCategoria as EfCategoryId)) {
        throw new BadRequestException({
          message: 'Categoría no válida',
          categoriasValidas: VALID_CATEGORY_IDS,
        });
      }
    }

    return this.statsService.getGlobalStats(
      parsedAnio,
      normalizedCategoria as EfCategoryId | undefined,
      normalizedTipoCultivo,
      normalizedIdProvinciaPoblacion,
    );
  }
}
