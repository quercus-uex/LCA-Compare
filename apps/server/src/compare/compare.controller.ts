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
import {
  CompareQueryDto,
  CompareQueryItemDto,
  CompareTraceQueryDto,
} from './dto/compare-query.dto';
import { CompareService } from './compare.service';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import type { CompareExportScope } from 'common/compare';
import type { Organizacion } from '../generated/prisma/client';
import { buildCompareTraceCSV } from './compare-trace.helpers';
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
   * parcelas y campañas que ese usuario puede ver. Devuelve las organizaciones
   * de los filtros, ya comprobadas.
   */
  private async assertAcceso(
    sets: (CompareQueryItemDto | undefined)[],
    user?: UserJwt,
  ): Promise<Map<string, Pick<Organizacion, 'id' | 'nombre'>>> {
    if (sets.some((filters) => filters?.idsParcela?.length) && !user) {
      throw new ForbiddenException(
        'Debes iniciar sesión para filtrar por parcelas',
      );
    }

    const ids = new Set(
      sets
        .map((filters) => filters?.idOrganizacion)
        .filter((id): id is string => !!id),
    );
    const organizaciones = new Map<
      string,
      Pick<Organizacion, 'id' | 'nombre'>
    >();
    await Promise.all(
      [...ids].map(async (id) => {
        organizaciones.set(
          id,
          await this.accesoService.getOrganizacionAdministrada(id, user?.sub),
        );
      }),
    );
    return organizaciones;
  }

  /**
   * La trazabilidad individual solo se exporta, con sesión, de conjuntos
   * filtrados por una organización que el usuario administra; así nunca salen
   * campañas sin consentimiento.
   */
  private async assertTraceAcceso(
    body: CompareTraceQueryDto,
    scope: CompareExportScope,
    user?: UserJwt,
  ): Promise<{
    organizaciones: Map<string, Pick<Organizacion, 'id' | 'nombre'>>;
    includeReference: boolean;
    includeTarget: boolean;
  }> {
    if (!user) {
      throw new ForbiddenException(
        'Debes iniciar sesión para exportar la trazabilidad',
      );
    }
    if (scope !== 'reference' && !body.target) {
      throw new BadRequestException(
        'Debes especificar los filtros del conjunto objetivo.',
      );
    }

    const includeReference = scope !== 'target';
    const includeTarget = scope !== 'reference';
    const sets = [
      ...(includeReference ? [body.reference] : []),
      ...(includeTarget ? [body.target!] : []),
    ];

    if (sets.some((set) => !set.idOrganizacion)) {
      throw new ForbiddenException(
        'La exportación de trazabilidad solo está disponible para conjuntos filtrados por una organización',
      );
    }

    const organizaciones = await this.assertAcceso(sets, user);
    return { organizaciones, includeReference, includeTarget };
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
    await this.assertAcceso([body.reference, body.target], user);
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

  @Post('/export')
  @ApiOperation({
    summary: 'Exportar la trazabilidad de una comparativa en JSON o CSV',
  })
  @ApiBadRequestResponse({
    description:
      'Faltan los filtros del conjunto objetivo (alcance full o target)',
    type: ApiErrorDto,
  })
  @ApiForbiddenResponse({
    description:
      'El usuario no administra alguna de las organizaciones o algún conjunto no está filtrado por una organización',
    type: ApiErrorDto,
  })
  @ApiUnprocessableEntityResponse({
    description: 'No existen datos suficientes para la comparativa',
    type: ApiErrorDto,
  })
  @ApiProduces('application/json', 'text/csv')
  @ApiOkResponse({
    description: 'Fichero con los resultados individuales y sus metadatos',
  })
  @HttpCode(HttpStatus.OK)
  async exportTrace(
    @Body() body: CompareTraceQueryDto,
    @AuthUser() user?: UserJwt,
  ): Promise<StreamableFile> {
    const scope = body.scope ?? 'full';
    const format = body.format ?? 'json';
    const { organizaciones, includeReference, includeTarget } =
      await this.assertTraceAcceso(body, scope, user);

    const [refResults, tarResults] = await Promise.all([
      includeReference
        ? this.compareService.findTraceResults(body.reference, user!.sub)
        : Promise.resolve(undefined),
      includeTarget
        ? this.compareService.findTraceResults(body.target!, user!.sub)
        : Promise.resolve(undefined),
    ]);

    if (
      (includeReference && !refResults?.length) ||
      (includeTarget && !tarResults?.length)
    ) {
      throw new UnprocessableEntityException('No hay datos suficientes.');
    }

    const trace = await this.compareService.buildTraceExport({
      scope,
      ...(refResults && {
        reference: {
          filters: body.reference,
          results: refResults,
          organizacion: organizaciones.get(body.reference.idOrganizacion!)!,
        },
      }),
      ...(tarResults && {
        target: {
          filters: body.target!,
          results: tarResults,
          organizacion: organizaciones.get(body.target!.idOrganizacion!)!,
        },
      }),
    });

    const content =
      format === 'csv'
        ? buildCompareTraceCSV(trace)
        : JSON.stringify(trace, null, 2);
    const timestamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14);

    return new StreamableFile(Buffer.from(content, 'utf8'), {
      type:
        format === 'csv'
          ? 'text/csv; charset=utf-8'
          : 'application/json; charset=utf-8',
      disposition: `attachment; filename="trazabilidad-${scope}-${timestamp}.${format}"`,
      length: Buffer.byteLength(content, 'utf8'),
    });
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
    await this.assertAcceso([body.reference, body.target], user);

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
