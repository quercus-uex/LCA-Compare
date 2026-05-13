import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ResultadoImpactoService } from '../resultadoimpacto/resultado-impacto.service';
import { ResultadoImpacto } from '../generated/prisma/client';
import { CompareResultDto } from './dto/compare-result.dto';
import { CompareQueryItemDto } from './dto/compare-query.dto';
import { chromium, Browser } from 'playwright';
import * as fs from 'node:fs';
import Handlebars from 'handlebars';
import { ProvinciaService } from '../provincia/provincia.service';
import { PoblacionService } from '../poblacion/poblacion.service';
import path from 'node:path';
import {
  ResultadoImpactoDataDto,
  ResultadoImpactoItemDto,
} from '../resultadoimpacto/dto/resultado-impacto-item.dto';
import { PaisService } from '../pais/pais.service';
import { AiService } from '../ai/ai.service';
import { IMPACT_KEYS, ResultadoImpactoWithRelations } from './compare.types';
import { extractLocationData } from './compare.helpers';

Handlebars.registerHelper('decimals', (value, digits: number) =>
  Number(value).toFixed(digits),
);
Handlebars.registerHelper('isOdd', (value: number) => value % 2 == 0);

@Injectable()
export class CompareService implements OnModuleInit, OnModuleDestroy {
  private readonly reportTemplate: HandlebarsTemplateDelegate;
  private browser: Browser;

  constructor(
    private readonly resultadoImpactoService: ResultadoImpactoService,
    private readonly provinciaService: ProvinciaService,
    private readonly poblacionService: PoblacionService,
    private readonly paisService: PaisService,
    private readonly aiService: AiService,
  ) {
    const reportTemplateFile = fs.readFileSync(
      path.resolve(__dirname, '../templates/compare-report.template.hbs'),
      'utf-8',
    );
    this.reportTemplate = Handlebars.compile(reportTemplateFile);
  }

  async onModuleInit() {
    this.browser = await chromium.launch();
  }

  async onModuleDestroy() {
    await this.browser?.close();
  }

  async findResults(filters: CompareQueryItemDto): Promise<ResultadoImpactoWithRelations[]> {
    const {
      idsPoblacion,
      idsProvincia,
      idsParcela,
      long,
      lat,
      range,
      tipoCultivo,
      anioCampaniaInicio,
      anioCampaniaFin,
      idPais,
    } = filters;

    let locationIds: string[] = [];

    if (lat && long && range) {
      const locationResults =
        await this.resultadoImpactoService.findManyAroundPoint(
          lat,
          long,
          range,
        );
      locationIds = locationResults.map((i) => i.id);
    }

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
      lat && long && range ? { id: { in: locationIds } } : null,
      idPais
        ? { cultivo: { parcela: { poblacion: { provincia: { idPais } } } } }
        : null,
    ].filter((i) => i !== null);

    const tipoCondition = tipoCultivo
      ? { cultivo: { tipo: tipoCultivo } }
      : null;

    const andConditions = [
      orConditions.length > 0 ? { OR: orConditions } : null,
      tipoCondition,
      anioCampaniaInicio || anioCampaniaFin
        ? {
            cultivo: {
              fechaInicioCampania: {
                ...(anioCampaniaInicio && {
                  gte: new Date(`${anioCampaniaInicio}-01-01T00:00:00.000Z`),
                }),
                ...(anioCampaniaFin && {
                  lt: new Date(`${anioCampaniaFin + 1}-01-01T00:00:00.000Z`),
                }),
              },
            },
          }
        : null,
    ].filter((i) => i !== null);

    let results: ResultadoImpactoWithRelations[] = [];

    if (andConditions.length > 0) {
      results = await this.resultadoImpactoService.findMany({
        where: { AND: andConditions },
      });
    }

    return results;
  }

  getMeanOfResults(
    results: ResultadoImpacto[],
  ): ResultadoImpactoDataDto | undefined {
    if (results.length === 0) return undefined;
    if (results.length === 1)
      return results[0].datos as ResultadoImpactoDataDto;

    const base = structuredClone(results[0].datos) as ResultadoImpactoDataDto;

    for (const key of IMPACT_KEYS) {
      base[key] = base[key].map((item) => ({ ...item, amount: 0, count: 0 }));
    }

    for (const result of results) {
      for (const key of IMPACT_KEYS) {
        const arr = result.datos![key] as ResultadoImpactoItemDto[];
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

    for (const key of IMPACT_KEYS) {
      base[key] = base[key].map((i) => ({
        ...i,
        amount: i.amount / i.count!,
        count: undefined,
      }));
    }
    return base;
  }

  async getMeanByFilters(filters: CompareQueryItemDto) {
    const results = await this.findResults(filters);
    return this.getMeanOfResults(results);
  }

  compareResults(
    refResults: ResultadoImpactoDataDto,
    tarResults?: ResultadoImpactoDataDto,
  ): CompareResultDto {
    const out: CompareResultDto = {
      impacto_total: [],
      impacto_fertilizantes: [],
      impacto_manejo_cultivo: [],
      impacto_pesticidas: [],
      impacto_sistema_riego: [],
    };

    const percentageDiff = (val1: number, val2: number) => {
      if (val2 === 0) return 0;
      return ((val1 - val2) / val2) * 100;
    };

    for (const key of IMPACT_KEYS) {
      out[key] = refResults[key].map((r) => {
        if (!tarResults) {
          return {
            category: r.category,
            unit: r.unit,
            refAmount: r.amount,
          };
        }

        const tarAmount =
          tarResults[key].find((i) => i.category === r.category)?.amount ?? 0;
        return {
          category: r.category,
          unit: r.unit,
          refAmount: r.amount,
          tarAmount,
          diff: percentageDiff(r.amount, tarAmount),
        };
      });
    }

    return out;
  }

  private async buildReportContext(
    results: ResultadoImpactoWithRelations[],
    filters: CompareQueryItemDto,
  ) {
    const { idsPais, idsProvincia, idsPoblacion, minYear, maxYear } =
      extractLocationData(results);

    const [paises, provincias, poblaciones] = await Promise.all([
      this.paisService.findMany({ where: { id: { in: idsPais } } }),
      this.provinciaService.findMany({ where: { id: { in: idsProvincia } } }),
      this.poblacionService.findMany({ where: { id: { in: idsPoblacion } } }),
    ]);

    const provinciaSet = new Set(filters.idsProvincia ?? []);
    const poblacionSet = new Set(filters.idsPoblacion ?? []);

    return {
      paises: paises.map((p) => ({ ...p, chosen: filters.idPais === p.id })),
      provincias: provincias.map((p) => ({
        ...p,
        chosen: provinciaSet.has(p.id),
      })),
      poblaciones: poblaciones.map((p) => ({
        ...p,
        chosen: poblacionSet.has(p.id),
      })),
      anioCampania: {
        inicio: { data: minYear, chosen: !!filters.anioCampaniaInicio },
        fin: { data: maxYear, chosen: !!filters.anioCampaniaFin },
      },
      tiposCultivo: [...new Set(results.map((r) => r.cultivo?.tipo))].map(
        (t) => ({
          nombre: t,
          chosen: t === filters.tipoCultivo,
        }),
      ),
      filters,
      results,
    };
  }

  async generateReport(
    refFilters: CompareQueryItemDto,
    refResults: ResultadoImpactoWithRelations[],
    tarFilters: CompareQueryItemDto,
    tarResults: ResultadoImpactoWithRelations[],
  ) {
    const comparison = this.compareResults(
      this.getMeanOfResults(refResults)!,
      this.getMeanOfResults(tarResults),
    );

    const overview = await this.aiService.generateFromTemplate(
      'compare-overview',
      { data: JSON.stringify(comparison) },
    );
    const recommendations = await this.aiService.generateFromTemplate(
      'compare-recommendations',
      { data: overview },
    );
    const refContext = await this.buildReportContext(refResults, refFilters);
    const tarContext = await this.buildReportContext(tarResults, tarFilters);

    const topImpacts = comparison.impacto_total
      .sort((a, b) => Math.abs(b.diff!) - Math.abs(a.diff!))
      .slice(0, 3);

    const html = this.reportTemplate({
      currentDate: new Date().toLocaleString('es-ES'),
      overview,
      recommendations,
      comparison,
      topImpacts,
      reference: refContext,
      target: tarContext,
    });

    const page = await this.browser.newPage();
    await page.setContent(html);

    return await page.pdf({
      format: 'A4',
      printBackground: true,
    });
  }
}
