import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { StatsService } from './stats.service';
import { GlobalStatsDto } from './dto/global-stats.dto';
import { ApiTags } from '@nestjs/swagger';
import { EF_CATEGORIES, type EfCategoryId } from '../compare/compare.types';

const VALID_CATEGORY_IDS = EF_CATEGORIES.map((c) => c.id);

@ApiTags('stats')
@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('global')
  getGlobalStats(
    @Query('anio') anio?: number,
    @Query('categoria') categoria?: string,
  ): Promise<GlobalStatsDto> {
    if (categoria !== undefined) {
      if (!VALID_CATEGORY_IDS.includes(categoria as EfCategoryId)) {
        throw new BadRequestException({
          message: 'Categoría no válida',
          categoriasValidas: VALID_CATEGORY_IDS,
        });
      }
    }
    return this.statsService.getGlobalStats(
      anio ? Number(anio) : undefined,
      categoria as EfCategoryId | undefined,
    );
  }
}
