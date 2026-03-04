import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
} from '@nestjs/common';
import { CompareQueryDto } from './dto/compare-query.dto';
import { CompareService } from './compare.service';

@Controller('/compare')
export class CompareController {
  constructor(private readonly compareService: CompareService) {}

  @Post('')
  async compare(@Body() body: CompareQueryDto) {
    const { left, right } = body;

    const arr = [left, right];

    const filtersMean = await Promise.all(
      arr
        .map(async (filter) => {
          if (!filter) return;
          const {
            idPoblacion,
            idProvincia,
            idParcela,
            lat,
            long,
            range,
            tipoCultivo,
          } = filter;

          if (idPoblacion) {
            return this.compareService.getMeanByPoblacionId(idPoblacion);
          } else if (idProvincia) {
            return this.compareService.getMeanByProvinciaId(idProvincia);
          } else if (idParcela && range) {
            return this.compareService.getMeanByParcelaId(idParcela, range);
          } else if (lat && long && range) {
            return this.compareService.getMeanByPointRange(lat, long, range);
          } else if (tipoCultivo) {
            return this.compareService.getMeanByTipoCultivo(tipoCultivo);
          }
          return;
        })
        .filter((i) => i !== undefined),
    );

    if (filtersMean[0] && filtersMean[1]) {
      return {
        data: {
          left: filtersMean[0],
          right: filtersMean[1],
          diff: this.compareService.getDiffBetweenResults(
            filtersMean[0],
            filtersMean[1],
          ),
        },
      };
    } else {
      return { data: { left: filtersMean[0], right: filtersMean[1] } };
    }
  }
}
