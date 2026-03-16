import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ResultadoImpactoService } from '../resultadoimpacto/resultado-impacto.service';
import { Prisma, ResultadoImpacto } from '../generated/prisma/client';
import { CompareResultDto } from './dto/compare-result.dto';
import { CompareQueryItemDto } from './dto/compare-query.dto';
import { OpenRouter } from '@openrouter/sdk';
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
      return value % 2 == 0;
    });
  }

  async onModuleInit() {
    this.browser = await chromium.launch();
  }

  async onModuleDestroy() {
    await this.browser?.close();
  }

  async findResults(filters: CompareQueryItemDto) {
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

    let results: Prisma.ResultadoImpactoGetPayload<{
      include: {
        cultivo: {
          include: {
            parcela: {
              include: { poblacion: { include: { provincia: true } } };
            };
          };
        };
      };
    }>[] = [];

    if (andConditions.length > 0) {
      results = await this.resultadoImpactoService.findMany({
        where: andConditions.length > 0 ? { AND: andConditions } : {},
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

    const keys = [
      'impacto_fertilizantes',
      'impacto_manejo_cultivo',
      'impacto_pesticidas',
      'impacto_sistema_riego',
      'impacto_total',
    ] as const;

    const base = results[0].datos as ResultadoImpactoDataDto;

    for (const key of keys) {
      base[key] = base[key].map((item) => ({ ...item, amount: 0, count: 0 }));
    }

    for (const result of results) {
      for (const key of keys) {
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

    for (const key of keys) {
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
    const keys = [
      'impacto_fertilizantes',
      'impacto_manejo_cultivo',
      'impacto_pesticidas',
      'impacto_sistema_riego',
      'impacto_total',
    ] as const;

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

    for (const key of keys) {
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

  async generateReport(
    refFilters: CompareQueryItemDto,
    refResults: Prisma.ResultadoImpactoGetPayload<{
      include: {
        cultivo: {
          include: {
            parcela: {
              include: { poblacion: { include: { provincia: true } } };
            };
          };
        };
      };
    }>[],
    tarFilters: CompareQueryItemDto,
    tarResults: Prisma.ResultadoImpactoGetPayload<{
      include: {
        cultivo: {
          include: {
            parcela: {
              include: { poblacion: { include: { provincia: true } } };
            };
          };
        };
      };
    }>[],
  ) {
    const reference = this.getMeanOfResults(refResults);
    const target = this.getMeanOfResults(tarResults);
    const comparison = this.compareResults(reference!, target);

    const overview = await this.openRouter.chat.send({
      chatGenerationParams: {
        messages: [
          {
            role: 'user',
            content: `
              Escribe un resumen claro y conciso tras interpretar los datos proporcionados, teniendo en cuenta que son el resultado de comparar dos conjuntos de datos en la metodología Environmental Footprint 3.1. Sigue las siguientes directrices:
                - refAmount es la cantidad referente al conjunto de referencia.
                - tarAmount es la cantidad referente al conjunto objetivo.
                - diff es la diferencia porcentual del conjunto objetivo respecto al de referencia.
                - La redacción será utilizada en un reporte, adecúate al formato de escritura.
                - Centra tu redacción en comparar ambos resultados, más que en analizar los resultados individualmente.
                - El resumen debe ocupar como máximo 150 palabras, pero puede (y DEBE en la mayoría de situaciones) ser considerablemente más corto.
                - Redacta como si los datos hubieran sido interpretados por una persona y no extraídos de un JSON.
                - Proporciona el resumen y nada más.
                - NUNCA referencies atributos concretos del JSON como refAmount o diff, refiérete a ellos siempre por su nombre (valor de referencia, diferencia).
                - El resumen DEBE COMENZAR POR "El conjunto de referencia...".
                - NUNCA repitas información.
              Datos: \`\`json ${JSON.stringify(comparison)} \`\`\`
            `,
          },
        ],
        //model: 'deepseek/deepseek-v3.2:nitro',
        model: 'openai/gpt-oss-120b:nitro',
      },
    });

    const recommendations = await this.openRouter.chat.send({
      chatGenerationParams: {
        messages: [
          {
            role: 'user',
            content: `
              En base al siguiente resumen de impactos usando la metodología Environmental Footprint 3.1, redacta un breve párrafo en estilo redactado de posibles mejoras recomendadas para el conjunto objetivo.
              Si no existe ninguna notable, dilo. Escribe en texto plano, no Markdown. El párrafo debe ocupar a lo sumo 100 palabras.
              Resumen: ${overview.choices[0].message.content as string}
            `,
          },
        ],
        model: 'openai/gpt-oss-120b:nitro',
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
      where: {
        id: {
          in: refResults.map((r) => r.cultivo!.parcela.poblacion!.idProvincia),
        },
      },
    });
    const refPoblaciones = await this.poblacionService.findMany({
      where: {
        id: {
          in: refResults.map((r) => r.cultivo!.parcela.idPoblacion!),
        },
      },
    });

    const refAnioCampania = {
      inicio: {
        data: refResults
          .sort(
            (a, b) =>
              a.cultivo!.fechaInicioCampania.getFullYear() -
              b.cultivo!.fechaInicioCampania.getFullYear(),
          )[0]
          .cultivo!.fechaInicioCampania.getFullYear(),
        chosen: !!refFilters.anioCampaniaInicio,
      },
      fin: {
        data: refResults
          .sort(
            (a, b) =>
              b.cultivo!.fechaInicioCampania.getFullYear() -
              a.cultivo!.fechaInicioCampania.getFullYear(),
          )[0]
          .cultivo!.fechaInicioCampania.getFullYear(),
        chosen: !!refFilters.anioCampaniaFin,
      },
    };

    const tarProvincias = await this.provinciaService.findMany({
      where: {
        id: {
          in: tarResults.map((r) => r.cultivo!.parcela.poblacion!.idProvincia),
        },
      },
    });
    const tarPoblaciones = await this.poblacionService.findMany({
      where: {
        id: {
          in: tarResults.map((r) => r.cultivo!.parcela.idPoblacion!),
        },
      },
    });

    const tarAnioCampania = {
      inicio: {
        data: tarResults
          .sort(
            (a, b) =>
              a.cultivo!.fechaInicioCampania.getFullYear() -
              b.cultivo!.fechaInicioCampania.getFullYear(),
          )[0]
          .cultivo!.fechaInicioCampania.getFullYear(),
        chosen: !!tarFilters.anioCampaniaInicio,
      },
      fin: {
        data: tarResults
          .sort(
            (a, b) =>
              b.cultivo!.fechaInicioCampania.getFullYear() -
              a.cultivo!.fechaInicioCampania.getFullYear(),
          )[0]
          .cultivo!.fechaInicioCampania.getFullYear(),
        chosen: !!tarFilters.anioCampaniaFin,
      },
    };

    const topImpacts = comparison.impacto_total
      .sort((a, b) => Math.abs(a.diff!) - Math.abs(b.diff!))
      .reverse()
      .slice(0, 3);

    const html = this.reportTemplate({
      currentDate: new Date().toLocaleString('es-ES'),
      overview: overview.choices[0].message.content as string,
      recommendations: recommendations.choices[0].message.content as string,
      comparison,
      topImpacts,
      reference: {
        provincias: {
          data: refProvincias.map((p) => ({
            ...p,
            chosen: !!refFilters.idsProvincia?.find((id) => id === p.id),
          })),
          //chosen: !!refFilters.idsProvincia,
        },
        poblaciones: {
          data: refPoblaciones.map((p) => ({
            ...p,
            chosen: !!refFilters.idsPoblacion?.find((id) => id === p.id),
          })),
        },
        filters: refFilters,
        results: refResults,
        anioCampania: refAnioCampania,
      },
      target: {
        provincias: {
          data: tarProvincias.map((p) => ({
            ...p,
            chosen: !!tarFilters.idsProvincia?.find((id) => id === p.id),
          })),
        },
        poblaciones: {
          data: tarPoblaciones.map((p) => ({
            ...p,
            chosen: !!tarFilters.idsPoblacion?.find((id) => id === p.id),
          })),
        },
        filters: tarFilters,
        results: tarResults,
        anioCampania: tarAnioCampania,
      },
    });

    const page = await this.browser.newPage();
    await page.setContent(html);

    return await page.pdf({
      format: 'A4',
      printBackground: true,
    });
  }
}
