import { Controller, Get, Query } from '@nestjs/common';
import { StatsService } from './stats.service';
import { GlobalStatsDto } from './dto/global-stats.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('stats')
@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('global')
  getGlobalStats(@Query('anio') anio?: number): Promise<GlobalStatsDto> {
    return this.statsService.getGlobalStats(anio ? Number(anio) : undefined);
  }
}
