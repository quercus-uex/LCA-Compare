import { ResultadoImpactoService } from './resultado-impacto.service';
import {
  Controller,
  Get,
  NotFoundException,
  Param,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { AuthUser, type UserJwt } from '../auth/auth-user.decorator';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiErrorDto } from '../common/dto/api-error.dto';
import { ApiResponseDto } from '../common/dto/api-response.dto';
import { ResultadoImpactoDto } from './dto/resultado-impacto.dto';
import { OrganizacionAccesoService } from '../organizacion/organizacion-acceso.service';

@ApiTags('Resultado de ACV')
@ApiBearerAuth()
@Controller('/resultado')
export class ResultadoImpactoController {
  constructor(
    private readonly resultadoImpactoService: ResultadoImpactoService,
    private readonly accesoService: OrganizacionAccesoService,
  ) {}

  @UseGuards(AuthGuard)
  @Get(':id')
  @ApiOperation({
    summary: 'Obtener un resultado de ACV por ID',
    description:
      'Lo ve el propietario de la parcela o el administrador de una organización a la que el propietario ha consentido la campaña del cultivo.',
  })
  @ApiUnauthorizedResponse({
    description:
      'Usuario no autenticado, o no es el propietario de la parcela ni tiene acceso a esa campaña',
    type: ApiErrorDto,
  })
  @ApiOkResponse({
    description: 'Resultado de ACV',
    type: ApiResponseDto(ResultadoImpactoDto),
  })
  async getById(@AuthUser() user: UserJwt, @Param('id') id: string) {
    const resultado = await this.resultadoImpactoService.findOne({ id });
    if (!resultado) throw new NotFoundException();

    const cultivo = resultado.cultivo!;
    if (cultivo.parcela.idPropietario !== user.sub) {
      const acceso = await this.accesoService.getAccesoOrganizacion(
        user.sub,
        cultivo.parcela.idPropietario,
      );
      const anio = cultivo.fechaInicioCampania.getUTCFullYear();
      if (!acceso?.anios.includes(anio))
        throw new UnauthorizedException(
          'No eres el propietario de esta parcela',
        );
    }

    return { data: resultado };
  }
}
