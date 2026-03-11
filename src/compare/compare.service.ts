import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ResultadoImpactoService } from '../resultadoimpacto/resultado-impacto.service';
import { ResultadoImpacto } from '../generated/prisma/client';
import {
  CompareResultDto,
  CompareResultItemDto,
} from './dto/compare-result.dto';
import { CompareQueryItemDto } from './dto/compare-query.dto';
import { OpenRouter } from '@openrouter/sdk';
import { chromium, Browser } from 'playwright';
import * as fs from 'node:fs';
import Handlebars from 'handlebars';
import { ProvinciaService } from '../provincia/provincia.service';
import { PoblacionService } from '../poblacion/poblacion.service';
import path from 'node:path';

@Injectable()
export class CompareService implements OnModuleInit, OnModuleDestroy {
  private openRouter: OpenRouter;
  private readonly reportTemplate: HandlebarsTemplateDelegate;
  private browser: Browser;

  constructor(
    private readonly resultadoImpactoService: ResultadoImpactoService,
    private readonly provinciaService: ProvinciaService,
    private readonly poblacionService: PoblacionService,
  ) {
    this.openRouter = new OpenRouter();
    const reportTemplateFile = fs.readFileSync(
      path.resolve(__dirname, '../templates/compare-report.template.hbs'),
      'utf-8',
    );
    this.reportTemplate = Handlebars.compile(reportTemplateFile);

    Handlebars.registerHelper('decimals', function (value, digits: number) {
      return Number(value).toFixed(digits);
    });

    Handlebars.registerHelper('isOdd', function (value: number) {
      return value % 2 == 1;
    });
  }

  async onModuleInit() {
    this.browser = await chromium.launch();
  }

  async onModuleDestroy() {
    await this.browser?.close();
  }

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

  async getMeanInclusive(filters: CompareQueryItemDto) {
    const {
      idsPoblacion,
      idsProvincia,
      idsParcela,
      long,
      lat,
      range,
      tipoCultivo,
    } = filters;

    const orConditions = [
      idsPoblacion?.length
        ? { cultivo: { parcela: { poblacion: { id: { in: idsPoblacion } } } } }
        : null,
      idsProvincia?.length
        ? {
            cultivo: {
              parcela: {
                poblacion: { provincia: { id: { in: idsProvincia } } },
              },
            },
          }
        : null,
      idsParcela?.length
        ? { cultivo: { parcela: { id: { in: idsParcela } } } }
        : null,
    ].filter((i) => i !== null);

    const tipoCondition = tipoCultivo
      ? { cultivo: { tipo: tipoCultivo } }
      : null;

    const andConditions = [
      orConditions.length > 0 ? { OR: orConditions } : null,
      tipoCondition,
    ].filter((i) => i !== null);

    let results: ResultadoImpacto[] = [];

    if (andConditions.length > 0) {
      results = await this.resultadoImpactoService.findMany({
        where: andConditions.length > 0 ? { AND: andConditions } : {},
      });
    }

    if (lat && long && range) {
      const resultsLocation =
        await this.resultadoImpactoService.findManyAroundPoint(
          lat,
          long,
          range,
        );
      const merged = [...results, ...resultsLocation]
        .reduce((map, item) => {
          map.set(item.id, item);
          return map;
        }, new Map<string, ResultadoImpacto>())
        .values();

      results = Array.from(merged);
    }

    return this.getMeanOfResults(results);
  }

  async generateReport(
    refFilters: CompareQueryItemDto,
    tarFilters: CompareQueryItemDto,
    result: {
      left: CompareResultDto;
      right: CompareResultDto;
      diff: {
        impacto_total: { category: string; diff: number }[];
        impacto_fertilizantes: { category: string; diff: number }[];
        impacto_sistema_riego: { category: string; diff: number }[];
        impacto_pesticidas: { category: string; diff: number }[];
        impacto_manejo_cultivo: { category: string; diff: number }[];
      };
    },
  ) {
    const overview = await this.openRouter.chat.send({
      chatGenerationParams: {
        messages: [
          {
            role: 'user',
            content: `
              Escribe un resumen claro y conciso tras interpretar los datos proporcionados, teniendo en cuenta que son el resultado de comparar dos conjuntos de datos en la metodología Environmental Footprint 3.1. Sigue las siguientes directrices:
                - left es el conjunto de referencia y right es el conjunto objetivo.
                - Nunca menciones right, left ni diff.
                - La redacción será utilizada en un reporte, adecúate al formato de escritura.
                - Centra tu redacción en comparar ambos resultados, más que en analizar los resultados individualmente.
                - El resumen debe ocupar como máximo 300 palabras, pero puede ser considerablemente más corto.
                - Redacta como si los datos hubieran sido interpretados por una persona y no extraídos de un JSON.
                - Proporciona el resumen y nada más.
                - El resumen DEBE COMENZAR POR "El conjunto objetivo...".
              Datos: \`\`json ${JSON.stringify(result)} \`\`\`
            `,
          },
        ],
        model: 'deepseek/deepseek-v3.2:nitro',
      },
    });
    /*
    const overview = {
      choices: [
        { message: { content: 'Esto es una prueba para no quedarme pobre.' } },
      ],
    };
     */

    const refProvincias = await this.provinciaService.findMany({
      where: { id: { in: refFilters.idsProvincia ?? [] } },
    });
    const refPoblaciones = await this.poblacionService.findMany({
      where: { id: { in: refFilters.idsPoblacion ?? [] } },
    });

    const tarProvincias = await this.provinciaService.findMany({
      where: { id: { in: tarFilters.idsProvincia ?? [] } },
    });
    const tarPoblaciones = await this.poblacionService.findMany({
      where: { id: { in: tarFilters.idsPoblacion ?? [] } },
    });

    const topImpacts = result.diff.impacto_total
      .sort((a, b) => a.diff - b.diff)
      .map((i) => ({
        ...i,
        amountRef: result.left.impacto_total.find(
          (j) => j.category === i.category,
        )?.amount,
        amountTar: result.right.impacto_total.find(
          (j) => j.category === i.category,
        )?.amount,
      }))
      .slice(0, 3);

    const resultReduced = {
      impacto_total: result.left.impacto_total.map((i) => ({
        ...i,
        amountRef: i.amount,
        amountTar: result.right.impacto_total.find(
          (j) => j.category === i.category,
        )?.amount,
        diff: result.diff.impacto_total.find((j) => j.category === i.category)
          ?.diff,
      })),
      impacto_fertilizantes: result.left.impacto_fertilizantes.map((i) => ({
        ...i,
        amountRef: i.amount,
        amountTar: result.right.impacto_fertilizantes.find(
          (j) => j.category === i.category,
        )?.amount,
        diff: result.diff.impacto_fertilizantes.find(
          (j) => j.category === i.category,
        )?.diff,
      })),
      impacto_manejo_cultivo: result.left.impacto_manejo_cultivo.map((i) => ({
        ...i,
        amountRef: i.amount,
        amountTar: result.right.impacto_manejo_cultivo.find(
          (j) => j.category === i.category,
        )?.amount,
        diff: result.diff.impacto_manejo_cultivo.find(
          (j) => j.category === i.category,
        )?.diff,
      })),
      impacto_pesticidas: result.left.impacto_pesticidas.map((i) => ({
        ...i,
        amountRef: i.amount,
        amountTar: result.right.impacto_pesticidas.find(
          (j) => j.category === i.category,
        )?.amount,
        diff: result.diff.impacto_pesticidas.find(
          (j) => j.category === i.category,
        )?.diff,
      })),
      impacto_sistema_riego: result.left.impacto_sistema_riego.map((i) => ({
        ...i,
        amountRef: i.amount,
        amountTar: result.right.impacto_sistema_riego.find(
          (j) => j.category === i.category,
        )?.amount,
        diff: result.diff.impacto_sistema_riego.find(
          (j) => j.category === i.category,
        )?.diff,
      })),
    };

    const html = this.reportTemplate({
      overview: overview.choices[0].message.content as string,
      refProvincias,
      refPoblaciones,
      refFilters,
      tarProvincias,
      tarPoblaciones,
      tarFilters,
      result: resultReduced,
      topImpacts,
    });

    const page = await this.browser.newPage();
    await page.setContent(html);

    return await page.pdf({
      format: 'A4',
      printBackground: true,
    });
  }

  async getMeanByPoblacionIds(ids: string[]) {
    const results = await this.resultadoImpactoService.findMany({
      where: { cultivo: { parcela: { idPoblacion: { in: ids } } } },
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
