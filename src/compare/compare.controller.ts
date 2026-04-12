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
    const { reference, target } = body;

    if (!body.reference)
      throw new BadRequestException(
        'Debes especificar los filtros del conjunto objetivo.',
      );

    const arr = [reference, target];

    const filtersMean = await Promise.all(
      arr.map(async (filter) => {
        if (!filter) return;
        return this.compareService.getMeanByFilters(filter);
      }),
    );

    if (!filtersMean[0] || (!filtersMean[1] && target)) {
      throw new UnprocessableEntityException('No hay datos suficientes.');
    }

    return {
      data: this.compareService.compareResults(filtersMean[0], filtersMean[1]),
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
