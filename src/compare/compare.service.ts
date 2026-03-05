import { Injectable } from '@nestjs/common';
import { ResultadoImpactoService } from '../resultadoimpacto/resultado-impacto.service';
import { ResultadoImpacto } from '../generated/prisma/client';
import {
  CompareResultDto,
  CompareResultItemDto,
} from './dto/compare-result.dto';

@Injectable()
export class CompareService {
  constructor(
    private readonly resultadoImpactoService: ResultadoImpactoService,
  ) {}

  getMeanOfResults(results: ResultadoImpacto[]) {
    if (results.length === 0) return null;
    if (results.length === 1) return results[0].datos as CompareResultDto;
    const keys = [
      'impacto_fertilizantes',
      'impacto_manejo_cultivo',
      'impacto_pesticidas',
      'impacto_sistema_riego',
      'impacto_total',
    ] as const;

    const base: CompareResultDto = results[0].datos as CompareResultDto;

    for (const key of keys) {
      base[key] = base[key].map((item) => ({ ...item, amount: 0, count: 0 }));
    }

    for (const result of results) {
      for (const key of keys) {
        const arr = result.datos![key] as CompareResultItemDto[];
        base[key] = base[key].map((item) => {
          return {
            ...item,
            count: (item.count ?? 0) + 1,
            amount:
              item.amount +
              arr.find((i) => i.category == item.category)!.amount,
          };
        });
      }
    }

    for (const key of keys) {
      base[key] = base[key].map((i) => ({
        ...i,
        amount: i.amount / i.count!,
        count: undefined,
      }));
    }
    return base;
  }

  async getMeanByPoblacionId(id: string) {
    const results = await this.resultadoImpactoService.findMany({
      where: { cultivo: { parcela: { idPoblacion: id } } },
    });
    return this.getMeanOfResults(results);
  }

  async getMeanByProvinciaId(id: string) {
    const results = await this.resultadoImpactoService.findMany({
      where: { cultivo: { parcela: { poblacion: { idProvincia: id } } } },
    });
    return this.getMeanOfResults(results);
  }

  async getMeanByParcelaId(id: string, range: number) {
    const results = await this.resultadoImpactoService.findManyAroundParcela(
      id,
      range,
    );
    return this.getMeanOfResults(results);
  }

  async getMeanByPointRange(lat: number, long: number, range: number) {
    const results = await this.resultadoImpactoService.findManyAroundPoint(
      lat,
      long,
      range,
    );
    return this.getMeanOfResults(results);
  }

  async getMeanByTipoCultivo(tipo: string) {
    const results =
      await this.resultadoImpactoService.findManyByTipoCultivo(tipo);
    return this.getMeanOfResults(results);
  }

  getDiffBetweenResults(result1: CompareResultDto, result2: CompareResultDto) {
    const keys = [
      'impacto_fertilizantes',
      'impacto_manejo_cultivo',
      'impacto_pesticidas',
      'impacto_sistema_riego',
      'impacto_total',
    ] as const;

    const percentageDiff = (val1: number, val2: number) => {
      if (val2 === 0) return 0;
      return (((val1 - val2) / val2) * 100).toFixed(2);
    };

    const diff: Map<string, { category: string; diff: number }> = {} as Map<
      string,
      { category: string; diff: number }
    >;

    for (const key of keys) {
      diff[key] = result1[key].map((left) => {
        const right = result2[key].find((i) => i.category === left.category);
        return {
          category: left.category,
          diff: percentageDiff(left.amount, right?.amount ?? 0),
        };
      });
    }
    return diff;
  }
}
