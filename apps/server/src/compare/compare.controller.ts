import {
  BadRequestException,
  Body,
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
    'Se filtra por una organización y el usuario no es su administrador',
  type: ApiErrorDto,
})
@UseGuards(OptionalAuthGuard)
@Controller('/compare')
export class CompareController {
  constructor(
    private readonly compareService: CompareService,
    private readonly accesoService: OrganizacionAccesoService,
  ) {}

  /** Solo el administrador de una organización puede filtrar por ella */
  private async assertOrganizaciones(
    body: CompareQueryDto,
    user?: UserJwt,
  ): Promise<void> {
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
    await this.assertOrganizaciones(body, user);
    const [refMean, tarMean] = await Promise.all([
      this.compareService.getMeanByFilters(body.reference),
      body.target
        ? this.compareService.getMeanByFilters(body.target)
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
    await this.assertOrganizaciones(body, user);

    const [refResults, tarResults] = await Promise.all([
      this.compareService.findResults(body.reference),
      this.compareService.findResults(body.target),
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
