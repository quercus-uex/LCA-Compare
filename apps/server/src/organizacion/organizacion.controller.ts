import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { AuthUser, type UserJwt } from '../auth/auth-user.decorator';
import type { Organizacion } from '../generated/prisma/client';
import { ApiErrorDto } from '../common/dto/api-error.dto';
import { ApiResponseDto } from '../common/dto/api-response.dto';
import { OrganizacionService } from './organizacion.service';
import {
  OrganizacionActual,
  OrganizacionAdminGuard,
} from './organizacion-admin.guard';
import {
  CreateOrganizacionDto,
  UpdateOrganizacionDto,
} from './dto/create-organizacion.dto';
import { SolicitarConsentimientoDto } from './dto/solicitar-consentimiento.dto';
import { TransferirOrganizacionDto } from './dto/transferir-organizacion.dto';
import {
  MiembroParcelasDto,
  MisOrganizacionesDto,
  OrganizacionDetalleDto,
  OrganizacionResumenDto,
  SolicitudConsentimientoResultadoDto,
} from './dto/organizacion.dto';

@ApiTags('Organizaciones')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: 'Usuario no autenticado',
  type: ApiErrorDto,
})
@UseGuards(AuthGuard)
@Controller('/organizaciones')
export class OrganizacionController {
  constructor(private readonly organizacionService: OrganizacionService) {}

  @Post('')
  @ApiOperation({
    summary: 'Crear una organización',
    description: 'Quien la crea pasa a ser su único administrador.',
  })
  @ApiCreatedResponse({ type: ApiResponseDto(OrganizacionResumenDto) })
  async create(@AuthUser() user: UserJwt, @Body() body: CreateOrganizacionDto) {
    return { data: await this.organizacionService.crear(user.sub, body) };
  }

  @Get('')
  @ApiOperation({
    summary: 'Organizaciones que administro y en las que tengo solicitudes',
  })
  @ApiOkResponse({ type: ApiResponseDto(MisOrganizacionesDto) })
  async getMias(@AuthUser() user: UserJwt) {
    return {
      data: await this.organizacionService.getMisOrganizaciones(user.sub),
    };
  }

  @Get(':id')
  @UseGuards(OrganizacionAdminGuard)
  @ApiOperation({ summary: 'Detalle de una organización con sus miembros' })
  @ApiNotFoundResponse({
    description: 'Organización no encontrada',
    type: ApiErrorDto,
  })
  @ApiForbiddenResponse({
    description: 'No eres el administrador de esta organización',
    type: ApiErrorDto,
  })
  @ApiOkResponse({ type: ApiResponseDto(OrganizacionDetalleDto) })
  async getById(@OrganizacionActual() organizacion: Organizacion) {
    return {
      data: await this.organizacionService.getDetalle(organizacion.id),
    };
  }

  @Patch(':id')
  @UseGuards(OrganizacionAdminGuard)
  @ApiOperation({ summary: 'Actualizar el nombre o la descripción' })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  @ApiForbiddenResponse({ type: ApiErrorDto })
  @ApiOkResponse({ type: ApiResponseDto(OrganizacionResumenDto) })
  async update(
    @OrganizacionActual() organizacion: Organizacion,
    @Body() body: UpdateOrganizacionDto,
  ) {
    return {
      data: await this.organizacionService.actualizar(organizacion.id, body),
    };
  }

  @Delete(':id')
  @UseGuards(OrganizacionAdminGuard)
  @ApiOperation({
    summary: 'Eliminar una organización',
    description:
      'Avisa a los usuarios con campañas aceptadas o pendientes. Devuelve la organización tal como estaba.',
  })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  @ApiForbiddenResponse({ type: ApiErrorDto })
  @ApiOkResponse({ type: ApiResponseDto(OrganizacionResumenDto) })
  async delete(@OrganizacionActual() organizacion: Organizacion) {
    return { data: await this.organizacionService.eliminar(organizacion.id) };
  }

  @Post(':id/solicitudes')
  @UseGuards(OrganizacionAdminGuard)
  @ApiOperation({
    summary: 'Pedir a un usuario acceso a sus campañas',
    description:
      'Los años rechazados o revocados se vuelven a pedir; los pendientes o aceptados se omiten.',
  })
  @ApiNotFoundResponse({
    description:
      'Organización no encontrada o no hay ningún usuario con ese email',
    type: ApiErrorDto,
  })
  @ApiBadRequestResponse({
    description: 'Datos no válidos o el email es el del administrador',
    type: ApiErrorDto,
  })
  @ApiForbiddenResponse({ type: ApiErrorDto })
  @ApiCreatedResponse({
    type: ApiResponseDto(SolicitudConsentimientoResultadoDto),
  })
  async solicitar(
    @OrganizacionActual() organizacion: Organizacion,
    @Body() body: SolicitarConsentimientoDto,
  ) {
    return {
      data: await this.organizacionService.solicitarConsentimiento(
        organizacion,
        body,
      ),
    };
  }

  @Delete(':id/consentimientos/:idConsentimiento')
  @UseGuards(OrganizacionAdminGuard)
  @ApiOperation({
    summary: 'Cancelar una solicitud pendiente o revocar una campaña aceptada',
  })
  @ApiNotFoundResponse({
    description: 'Organización o consentimiento no encontrado',
    type: ApiErrorDto,
  })
  @ApiConflictResponse({
    description: 'El consentimiento está rechazado o ya revocado',
    type: ApiErrorDto,
  })
  @ApiForbiddenResponse({ type: ApiErrorDto })
  @ApiOkResponse({ type: ApiResponseDto(OrganizacionDetalleDto) })
  async revocar(
    @OrganizacionActual() organizacion: Organizacion,
    @Param('idConsentimiento') idConsentimiento: string,
  ) {
    return {
      data: await this.organizacionService.revocarConsentimiento(
        organizacion,
        idConsentimiento,
      ),
    };
  }

  @Delete(':id/miembros/:idUsuario')
  @UseGuards(OrganizacionAdminGuard)
  @ApiOperation({
    summary: 'Expulsar a un miembro',
    description:
      'Revoca sus campañas aceptadas y borra sus solicitudes pendientes o rechazadas.',
  })
  @ApiNotFoundResponse({
    description:
      'Organización no encontrada o el usuario no tiene solicitudes en ella',
    type: ApiErrorDto,
  })
  @ApiForbiddenResponse({ type: ApiErrorDto })
  @ApiOkResponse({ type: ApiResponseDto(OrganizacionDetalleDto) })
  async expulsar(
    @OrganizacionActual() organizacion: Organizacion,
    @Param('idUsuario') idUsuario: string,
  ) {
    return {
      data: await this.organizacionService.expulsarMiembro(
        organizacion,
        idUsuario,
      ),
    };
  }

  @Post(':id/transferir')
  @HttpCode(HttpStatus.OK)
  @UseGuards(OrganizacionAdminGuard)
  @ApiOperation({ summary: 'Transferir la administración a un miembro' })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  @ApiBadRequestResponse({
    description: 'El usuario no es miembro de la organización',
    type: ApiErrorDto,
  })
  @ApiForbiddenResponse({ type: ApiErrorDto })
  @ApiOkResponse({ type: ApiResponseDto(OrganizacionResumenDto) })
  async transferir(
    @OrganizacionActual() organizacion: Organizacion,
    @Body() body: TransferirOrganizacionDto,
  ) {
    return {
      data: await this.organizacionService.transferir(
        organizacion,
        body.idUsuario,
      ),
    };
  }

  @Get(':id/miembros/:idUsuario/parcelas')
  @UseGuards(OrganizacionAdminGuard)
  @ApiOperation({
    summary: 'Parcelas de un miembro en sus campañas aceptadas',
  })
  @ApiNotFoundResponse({
    description:
      'Organización no encontrada o el usuario no ha aceptado ninguna campaña',
    type: ApiErrorDto,
  })
  @ApiForbiddenResponse({ type: ApiErrorDto })
  @ApiOkResponse({ type: ApiResponseDto(MiembroParcelasDto) })
  async getParcelasMiembro(
    @OrganizacionActual() organizacion: Organizacion,
    @Param('idUsuario') idUsuario: string,
  ) {
    return {
      data: await this.organizacionService.getParcelasMiembro(
        organizacion.id,
        idUsuario,
      ),
    };
  }
}
