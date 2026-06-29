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
import { PaisService } from '../pais/pais.service';
import { AiService } from '../ai/ai.service';
import { IMPACT_KEYS, ResultadoImpactoWithRelations } from './compare.types';
import { extractLocationData } from './compare.helpers';
import { ResultadoImpactoDto } from '../resultadoimpacto/dto/resultado-impacto.dto';
import {
  COMPARE_REPORT_DEFAULT_LANGUAGE,
  getReportLabels,
  isCompareReportLanguage,
  translateCategory,
  translateCropType,
} from './compare-report.i18n';
import type { CompareReportLanguage } from 'common/compare';

Handlebars.registerHelper('decimals', (value, digits: number) =>
  Number(value).toFixed(digits),
);
type PercentHelperOptions = {
  data?: { root?: { labels?: { notAvailable?: string } } };
};

Handlebars.registerHelper(
  'percent',
  function (
    value: number | null | undefined,
    digits: number,
    options: PercentHelperOptions,
  ) {
    const notAvailable = options?.data?.root?.labels?.notAvailable ?? 'n/a';
    return value == null ? notAvailable : `${Number(value).toFixed(digits)} %`;
  },
);
Handlebars.registerHelper('isOdd', (value: number) => value % 2 == 0);
Handlebars.registerHelper('scientific', (value: number, digits: number) => {
  const num = Number(value);
  if (num === 0) return num.toFixed(digits);
  const abs = Math.abs(num);
  if (abs < 0.001) {
    const exp = Math.floor(Math.log10(abs));
    const mantissa = num / Math.pow(10, exp);
    return `${mantissa.toFixed(digits)}e${exp}`;
  }
  return num.toFixed(digits);
});

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

  async findResults(
    filters: CompareQueryItemDto,
  ): Promise<ResultadoImpactoWithRelations[]> {
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

    const hasLocationFilter = lat != null && long != null && range != null;

    if (hasLocationFilter) {
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
      hasLocationFilter ? { id: { in: locationIds } } : null,
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
  ): ResultadoImpactoDto | undefined {
    if (!results.length) return undefined;
    if (results.length === 1)
      return results[0].datos as unknown as ResultadoImpactoDto;

    const base = structuredClone(
      results[0].datos,
    ) as unknown as ResultadoImpactoDto;

    for (const key of IMPACT_KEYS) {
      base[key] = base[key].map((item) => {
        const sum = results.reduce((acc, r) => {
          const data = r.datos as unknown as ResultadoImpactoDto;
          const found = data[key]?.find((i) => i.category === item.category);
          return acc + (found?.amount ?? 0);
        }, 0);
        return { ...item, amount: sum / results.length };
      });
    }

    return base;
  }

  async getMeanByFilters(filters: CompareQueryItemDto) {
    const results = await this.findResults(filters);
    return this.getMeanOfResults(results);
  }

  private readonly percentageDiff = (a: number, b: number): number | null =>
    b === 0 ? null : ((a - b) / b) * 100;

  compareResults(
    refResults: ResultadoImpactoDto,
    tarResults?: ResultadoImpactoDto,
  ): CompareResultDto {
    return Object.fromEntries(
      IMPACT_KEYS.map((key) => [
        key,
        refResults[key].map((r) => {
          const tarItem = tarResults?.[key]?.find(
            (i) => i.category === r.category,
          );
          const tarAmount = tarItem?.amount ?? 0;
          return {
            category: r.category,
            unit: r.unit,
            refAmount: r.amount,
            ...(tarResults && {
              tarAmount,
              diff: this.percentageDiff(r.amount, tarAmount),
            }),
          };
        }),
      ]),
    ) as unknown as CompareResultDto;
  }

  private async buildReportContext(
    results: ResultadoImpactoWithRelations[],
    filters: CompareQueryItemDto,
    language: CompareReportLanguage,
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
          nombre: translateCropType(t, language),
          chosen: t === filters.tipoCultivo,
        }),
      ),
      filters,
      results,
    };
  }

  private localizeComparison(
    comparison: CompareResultDto,
    language: CompareReportLanguage,
  ): CompareResultDto {
    const localized = structuredClone(comparison);
    for (const key of IMPACT_KEYS) {
      localized[key] = localized[key].map((item) => ({
        ...item,
        category: translateCategory(item.category, language),
      }));
    }
    return localized;
  }

  private resolveReportLanguage(
    language?: CompareReportLanguage,
  ): CompareReportLanguage {
    return language && isCompareReportLanguage(language)
      ? language
      : COMPARE_REPORT_DEFAULT_LANGUAGE;
  }

  private promptName(base: string, language: CompareReportLanguage): string {
    return language === 'es' ? base : `${base}-${language}`;
  }

  async generateReport(
    refFilters: CompareQueryItemDto,
    refResults: ResultadoImpactoWithRelations[],
    tarFilters: CompareQueryItemDto,
    tarResults: ResultadoImpactoWithRelations[],
    language?: CompareReportLanguage,
  ) {
    const reportLanguage = this.resolveReportLanguage(language);
    const labels = getReportLabels(reportLanguage);

    const comparison = this.compareResults(
      this.getMeanOfResults(refResults)!,
      this.getMeanOfResults(tarResults),
    );
    const localizedComparison = this.localizeComparison(
      comparison,
      reportLanguage,
    );

    const overview = await this.aiService.generateFromTemplate(
      this.promptName('compare-overview', reportLanguage),
      { data: JSON.stringify(localizedComparison) },
    );
    const recommendations = await this.aiService.generateFromTemplate(
      this.promptName('compare-recommendations', reportLanguage),
      { data: overview },
    );
    const refContext = await this.buildReportContext(
      refResults,
      refFilters,
      reportLanguage,
    );
    const tarContext = await this.buildReportContext(
      tarResults,
      tarFilters,
      reportLanguage,
    );

    const topImpacts = localizedComparison.impacto_total
      .toSorted((a, b) => Math.abs(b.diff ?? 0) - Math.abs(a.diff ?? 0))
      .slice(0, 3);

    const html = this.reportTemplate({
      currentDate: new Date().toLocaleString(labels.dateLocale),
      labels,
      lang: labels.htmlLang,
      overview,
      recommendations,
      comparison: localizedComparison,
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
