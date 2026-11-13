import {
  BadRequestException,
  Body,
  ForbiddenException,
  Controller,
  Header,
  HttpCode,
  HttpStatus,
  Post,
  StreamableFile,
  UnprocessableEntityException,
  UseGuards,
} from '@nestjs/common';
import { CompareQueryDto } from './dto/compare-query.dto';
import { CompareService } from './compare.service';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { ApiErrorDto } from '../common/dto/api-error.dto';
import { ApiResponseDto } from '../common/dto/api-response.dto';
import { CompareResultDtoClass } from './dto/compare-result.dto';
import { OptionalAuthGuard } from '../auth/optional-auth.guard';
import { AuthUser, type UserJwt } from '../auth/auth-user.decorator';
import { OrganizacionAccesoService } from '../organizacion/organizacion-acceso.service';

@ApiTags('Comparativa')
@ApiBearerAuth()
@ApiForbiddenResponse({
  description:
    'Se filtra por una organización que el usuario no administra, o por parcelas sin haber iniciado sesión',
  type: ApiErrorDto,
})
@UseGuards(OptionalAuthGuard)
@Controller('/compare')
export class CompareController {
  constructor(
    private readonly compareService: CompareService,
    private readonly accesoService: OrganizacionAccesoService,
  ) {}

  /**
   * Solo el administrador de una organización puede filtrar por ella, y el
   * filtro por parcelas requiere sesión: el servicio lo limita después a las
   * parcelas y campañas que ese usuario puede ver
   */
  private async assertAcceso(
    body: CompareQueryDto,
    user?: UserJwt,
  ): Promise<void> {
    const filtraPorParcelas = [body.reference, body.target].some(
      (filters) => filters?.idsParcela?.length,
    );
    if (filtraPorParcelas && !user) {
      throw new ForbiddenException(
        'Debes iniciar sesión para filtrar por parcelas',
      );
    }

    const ids = new Set(
      [body.reference?.idOrganizacion, body.target?.idOrganizacion].filter(
        (id): id is string => !!id,
      ),
    );
    await Promise.all(
      [...ids].map((id) =>
        this.accesoService.getOrganizacionAdministrada(id, user?.sub),
      ),
    );
  }

  @Post('')
  @ApiOperation({ summary: 'Comparar conjuntos de cultivos' })
  @ApiBadRequestResponse({
    description:
      'Debes especificar los filtros de los conjuntos de referencia y objetivo',
    type: ApiErrorDto,
  })
  @ApiUnprocessableEntityResponse({
    description: 'No existen datos suficientes para la comparativa',
    type: ApiErrorDto,
  })
  @ApiOkResponse({
    description: 'Resultados de la comparativa',
    type: ApiResponseDto(CompareResultDtoClass),
  })
  @HttpCode(HttpStatus.OK)
  async compare(@Body() body: CompareQueryDto, @AuthUser() user?: UserJwt) {
    await this.assertAcceso(body, user);
    const [refMean, tarMean] = await Promise.all([
      this.compareService.getMeanByFilters(body.reference, user?.sub),
      body.target
        ? this.compareService.getMeanByFilters(body.target, user?.sub)
        : Promise.resolve(undefined),
    ]);

    if (!refMean || (!tarMean && body.target))
      throw new UnprocessableEntityException('No hay datos suficientes.');

    return {
      data: this.compareService.compareResults(refMean, tarMean),
    };
  }

  @Post('/report')
  @ApiOperation({ summary: 'Generar un informe en PDF de una comparativa' })
  @ApiBadRequestResponse({
    description:
      'Debes especificar los filtros de los conjuntos de referencia y objetivo',
    type: ApiErrorDto,
  })
  @ApiUnprocessableEntityResponse({
    description: 'No existen datos suficientes para la comparativa',
    type: ApiErrorDto,
  })
  @ApiOkResponse({
    description: 'Informe generado con éxito',
  })
  @HttpCode(HttpStatus.OK)
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'inline; filename=report.pdf')
  async compareToReport(
    @Body() body: CompareQueryDto,
    @AuthUser() user?: UserJwt,
  ) {
    if (!body.reference || !body.target)
      throw new BadRequestException(
        'Debes especificar los filtros del conjunto objetivo y referencia.',
      );
    await this.assertAcceso(body, user);

    const [refResults, tarResults] = await Promise.all([
      this.compareService.findResults(body.reference, user?.sub),
      this.compareService.findResults(body.target, user?.sub),
    ]);

    if (!refResults.length || !tarResults.length)
      throw new UnprocessableEntityException('No hay datos suficientes.');

    const report = await this.compareService.generateReport(
      body.reference,
      refResults,
      body.target,
      tarResults,
      body.language,
    );

    return new StreamableFile(report);
  }
}
