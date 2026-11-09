import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { StatsService } from './stats.service';
import { GlobalStatsDto } from './dto/global-stats.dto';
import { GlobalStatsQueryDto } from './dto/global-stats-query.dto';
import { OptionalAuthGuard } from '../auth/optional-auth.guard';
import { AuthUser, type UserJwt } from '../auth/auth-user.decorator';
import { OrganizacionAccesoService } from '../organizacion/organizacion-acceso.service';
import { ApiErrorDto } from '../common/dto/api-error.dto';

@ApiTags('stats')
@Controller('stats')
export class StatsController {
  constructor(
    private readonly statsService: StatsService,
    private readonly accesoService: OrganizacionAccesoService,
  ) {}

  @Get('global')
  @UseGuards(OptionalAuthGuard)
  @ApiBearerAuth()
  @ApiForbiddenResponse({
    description:
      'Se filtra por una organización y el usuario no es su administrador',
    type: ApiErrorDto,
  })
  @ApiOkResponse({ type: GlobalStatsDto })
  async getGlobalStats(
    @Query() query: GlobalStatsQueryDto,
    @AuthUser() user?: UserJwt,
  ): Promise<GlobalStatsDto> {
    if (query.idOrganizacion) {
      await this.accesoService.getOrganizacionAdministrada(
        query.idOrganizacion,
        user?.sub,
      );
    }
    return this.statsService.getGlobalStats({
      anio: query.anio,
      tipoCultivo: query.tipoCultivo,
      idOrganizacion: query.idOrganizacion,
    });
  }
}
