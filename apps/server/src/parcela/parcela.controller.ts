import {
  Controller,
  Get,
  UseGuards,
  Param,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ParcelaService } from './parcela.service';
import { AuthGuard } from '../auth/auth.guard';
import { AuthUser, type UserJwt } from '../auth/auth-user.decorator';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiErrorDto } from '../common/dto/api-error.dto';
import { ApiResponseDto } from '../common/dto/api-response.dto';
import { ApiResponseArrayDto } from '../common/dto/api-response-array.dto';
import { ParcelaDetalleDto, ParcelaResumenDto } from './dto/parcela.dto';
import { OrganizacionAccesoService } from '../organizacion/organizacion-acceso.service';

@ApiTags('Parcela')
@ApiBearerAuth()
@Controller('/parcela')
export class ParcelaController {
  constructor(
    private readonly parcelaService: ParcelaService,
    private readonly accesoService: OrganizacionAccesoService,
  ) {}

  @UseGuards(AuthGuard)
  @Get('')
  @ApiOperation({
    summary: 'Obtener las parcelas del usuario autenticado',
    description:
      'Cada parcela incluye su ubicación, su último cultivo, su número de campañas y su polígono.',
  })
  @ApiUnauthorizedResponse({
    description: 'Credenciales inválidas',
    type: ApiErrorDto,
  })
  @ApiOkResponse({
    description: 'Parcelas del usuario',
    type: ApiResponseArrayDto(ParcelaResumenDto),
  })
  async getByAuthUser(@AuthUser() user: UserJwt) {
    const [parcelas, geoms] = await Promise.all([
      this.parcelaService.findResumenByPropietario(user.sub),
      this.parcelaService.getGeomsByPropietario(user.sub),
    ]);

    return {
      data: parcelas.map((p) => ({ ...p, geom: geoms.get(p.id) ?? null })),
    };
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  @ApiOperation({
    summary: 'Obtener una parcela por ID',
    description:
      'El propietario la ve entera. El administrador de una organización a la que el propietario ha consentido campañas la ve solo con los cultivos de esos años, más el campo `acceso`.',
  })
  @ApiNotFoundResponse({
    description: 'Parcela no encontrada',
    type: ApiErrorDto,
  })
  @ApiUnauthorizedResponse({
    description:
      'Credenciales inválidas, o el usuario no es el propietario ni tiene acceso a ninguna de sus campañas',
    type: ApiErrorDto,
  })
  @ApiOkResponse({
    description: 'Parcela',
    type: ApiResponseDto(ParcelaDetalleDto),
  })
  async getById(@AuthUser() user: UserJwt, @Param('id') id: string) {
    // La geometría se lee a la vez que el detalle, pero solo se devuelve a
    // quien tiene acceso
    const [parcela, geom] = await Promise.all([
      this.parcelaService.findDetalle(id),
      this.parcelaService.getGeom(id),
    ]);
    if (!parcela) throw new NotFoundException();
    if (parcela.idPropietario === user.sub) {
      return { data: { ...parcela, geom } };
    }

    const noAutorizado = () =>
      new UnauthorizedException('No eres el propietario de esta parcela');
    const acceso = await this.accesoService.getAccesoOrganizacion(
      user.sub,
      parcela.idPropietario,
    );
    if (!acceso) throw noAutorizado();

    const anios = new Set(acceso.anios);
    const cultivos = parcela.cultivos.filter((c) =>
      anios.has(c.fechaInicioCampania.getUTCFullYear()),
    );
    if (cultivos.length === 0) throw noAutorizado();

    return { data: { ...parcela, cultivos, acceso, geom } };
  }
}
