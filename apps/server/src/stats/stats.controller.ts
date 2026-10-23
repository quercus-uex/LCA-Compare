import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { StatsService } from './stats.service';
import { GlobalStatsDto } from './dto/global-stats.dto';
import { GlobalStatsQueryDto } from './dto/global-stats-query.dto';

@ApiTags('stats')
@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('global')
  @ApiOkResponse({ type: GlobalStatsDto })
  getGlobalStats(@Query() query: GlobalStatsQueryDto): Promise<GlobalStatsDto> {
    return this.statsService.getGlobalStats({
      anio: query.anio,
      tipoCultivo: query.tipoCultivo,
    });
  }
}
