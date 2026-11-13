import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { AuthUser, type UserJwt } from '../auth/auth-user.decorator';
import { ApiErrorDto } from '../common/dto/api-error.dto';
import { ApiResponseDto } from '../common/dto/api-response.dto';
import { NotificacionService } from './notificacion.service';
import { NotificacionesDto } from './dto/organizacion.dto';
import { MarcarAvisosLeidosDto } from './dto/marcar-avisos-leidos.dto';
import { ResponderConsentimientosDto } from './dto/responder-consentimientos.dto';

@ApiTags('Notificaciones')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: 'Usuario no autenticado',
  type: ApiErrorDto,
})
@UseGuards(AuthGuard)
@Controller()
export class NotificacionController {
  constructor(private readonly notificacionService: NotificacionService) {}

  @Get('/notificaciones')
  @ApiOperation({
    summary: 'Mis solicitudes pendientes y mis avisos más recientes',
  })
  @ApiOkResponse({ type: ApiResponseDto(NotificacionesDto) })
  async get(@AuthUser() user: UserJwt) {
    return {
      data: await this.notificacionService.getNotificaciones(user.sub),
    };
  }

  @Patch('/notificaciones/leidas')
  @ApiOperation({
    summary: 'Marcar avisos como leídos',
    description: 'Sin ids se marcan todos los avisos propios.',
  })
  @ApiOkResponse({ type: ApiResponseDto(NotificacionesDto) })
  async marcarLeidas(
    @AuthUser() user: UserJwt,
    @Body() body: MarcarAvisosLeidosDto,
  ) {
    return {
      data: await this.notificacionService.marcarLeidas(user.sub, body.ids),
    };
  }

  @Patch('/consentimientos')
  @ApiOperation({
    summary: 'Aceptar o rechazar solicitudes pendientes',
    description:
      'Si alguna solicitud no se puede responder, no se responde ninguna.',
  })
  @ApiNotFoundResponse({
    description: 'Alguna solicitud no existe o no es tuya',
    type: ApiErrorDto,
  })
  @ApiConflictResponse({
    description: 'Alguna solicitud ya se ha respondido',
    type: ApiErrorDto,
  })
  @ApiOkResponse({ type: ApiResponseDto(NotificacionesDto) })
  async responder(
    @AuthUser() user: UserJwt,
    @Body() body: ResponderConsentimientosDto,
  ) {
    return {
      data: await this.notificacionService.responder(user.sub, body),
    };
  }
}
