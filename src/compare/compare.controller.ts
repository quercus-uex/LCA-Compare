import {
  BadRequestException,
  Body,
  Controller,
  Header,
  Post,
  StreamableFile,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CompareQueryDto } from './dto/compare-query.dto';
import { CompareService } from './compare.service';

@Controller('/compare')
export class CompareController {
  constructor(private readonly compareService: CompareService) {}

  @Post('')
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
