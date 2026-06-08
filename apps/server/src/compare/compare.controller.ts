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
} from '@nestjs/common';
import { CompareQueryDto } from './dto/compare-query.dto';
import { CompareService } from './compare.service';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { ApiErrorDto } from '../common/dto/api-error.dto';
import { ApiResponseDto } from '../common/dto/api-response.dto';
import { CompareResultDtoClass } from './dto/compare-result.dto';

@ApiTags('Comparativa')
@Controller('/compare')
export class CompareController {
  constructor(private readonly compareService: CompareService) {}

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
  async compare(@Body() body: CompareQueryDto) {
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
  @ApiOkResponse({
    description: 'Informe generado con éxito',
  })
  @HttpCode(HttpStatus.OK)
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'inline; filename=report.pdf')
  async compareToReport(@Body() body: CompareQueryDto) {
    if (!body.reference || !body.target)
      throw new BadRequestException(
        'Debes especificar los filtros del conjunto objetivo y referencia.',
      );

    const refResults = await this.compareService.findResults(body.reference);
    const tarResults = await this.compareService.findResults(body.target);

    const report = await this.compareService.generateReport(
      body.reference,
      refResults,
      body.target,
      tarResults,
    );

    return new StreamableFile(report);
  }
}
