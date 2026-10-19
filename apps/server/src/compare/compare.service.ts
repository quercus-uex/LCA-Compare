import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
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
import { CompareQueryBuilder } from './compare-query.builder';
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

/**
 * Formats an impact amount with `significant` significant digits. Values
 * below 0.01 use scientific notation so tiny indicators (e.g. CTUh, disease
 * incidence) do not collapse to 0.
 */
export function formatAmount(value: unknown, significant = 4): string {
  const num = Number(value);
  if (value == null || !Number.isFinite(num)) return '';
  if (num === 0) return '0';
  const abs = Math.abs(num);
  if (abs < 0.01) {
    const [mantissa, exponent] = num.toExponential(significant - 1).split('e');
    return `${mantissa}×10<sup>${Number(exponent)}</sup>`;
  }
  if (abs >= 10 ** significant) return num.toFixed(0);
  return num.toPrecision(significant);
}

export function formatPercent(
  value: number | null | undefined,
  digits: number,
) {
  if (value == null) return undefined;
  const sign = value > 0 ? '+' : '';
  return `${sign}${Number(value).toFixed(digits)} %`;
}

Handlebars.registerHelper(
  'amount',
  (value: unknown) => new Handlebars.SafeString(formatAmount(value)),
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
    return formatPercent(value, digits) ?? notAvailable;
  },
);
Handlebars.registerHelper('coords', (lat: number, long: number) =>
  [lat, long].map((n) => Number(n).toFixed(5)).join(', '),
);
// The last argument is Handlebars' options object, not a value to join
Handlebars.registerHelper('concat', (...args: unknown[]) =>
  args.slice(0, -1).join(''),
);

@Injectable()
export class CompareService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CompareService.name);
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
    let locationIds: string[] | undefined;

    const { lat, long, range } = filters;
    const hasLocationFilter = lat != null && long != null && range != null;

    if (hasLocationFilter) {
      const locationResults =
        await this.resultadoImpactoService.findManyAroundPoint(
          lat,
          long,
          range,
          CompareQueryBuilder.buildCultivoFilter(filters),
        );
      locationIds = locationResults.map((i) => i.id);
    }

    const where = CompareQueryBuilder.build(filters, locationIds);

    if (!where) {
      return [];
    }

    return this.resultadoImpactoService.findMany({ where });
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
      // Si el usuario filtró por año se muestra el año elegido; si no, el
      // rango de años de los datos, que la plantilla marca como no escogido
      anioCampania: {
        inicio: {
          data: filters.anioCampaniaInicio || (results.length ? minYear : null),
          chosen: !!filters.anioCampaniaInicio,
        },
        fin: {
          data: filters.anioCampaniaFin || (results.length ? maxYear : null),
          chosen: !!filters.anioCampaniaFin,
        },
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

  /**
   * Returns undefined when OpenRouter fails or returns empty content, so the
   * report omits that section instead of failing.
   */
  private async tryGenerateAiText(
    templateName: string,
    context: Record<string, string>,
  ): Promise<string | undefined> {
    try {
      const text = await this.aiService.generateFromTemplate(
        templateName,
        context,
      );
      return text?.trim() ? text : undefined;
    } catch (error) {
      this.logger.warn(
        `AI generation failed for ${templateName}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return undefined;
    }
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

    const overview = await this.tryGenerateAiText(
      this.promptName('compare-overview', reportLanguage),
      { data: JSON.stringify(localizedComparison) },
    );
    // Recommendations are generated from the overview, so skip them without it
    const recommendations = overview
      ? await this.tryGenerateAiText(
          this.promptName('compare-recommendations', reportLanguage),
          { data: overview },
        )
      : undefined;
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
    try {
      // Tailwind and the font load from a CDN; wait for them before printing
      await page.setContent(html, { waitUntil: 'networkidle' });
      return await page.pdf({
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
      });
    } finally {
      await page.close();
    }
  }
}
