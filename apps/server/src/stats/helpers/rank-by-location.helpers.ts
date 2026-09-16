import type { EfCategoryId } from 'common/impact';
import {
  meanCategories,
  round,
  sortByImpact,
  totalImpact,
  type CategoryAmountRecord,
} from '../stats-aggregation.helpers';
import type {
  PoblacionRankingItemDto,
  ProvinciaRankingItemDto,
} from '../dto/global-stats.dto';
import type { CultivoWithGeo } from './stats.types';

type GroupedProvincia = {
  nombreProvincia: string;
  parcelaIds: Set<string>;
  cultivos: CultivoWithGeo[];
  categoryRecords: CategoryAmountRecord[];
};

type GroupedPoblacion = {
  nombrePoblacion: string;
  nombreProvincia: string;
  parcelaIds: Set<string>;
  categoryRecords: CategoryAmountRecord[];
};

export function rankProvincias(
  cultivos: CultivoWithGeo[],
  categoryMap: Map<string, CategoryAmountRecord>,
  categoria?: EfCategoryId,
): ProvinciaRankingItemDto[] {
  const grouped = new Map<string, GroupedProvincia>();

  for (const c of cultivos) {
    const provincia = c.parcela?.poblacion?.provincia;
    if (!provincia) continue;

    let entry = grouped.get(provincia.id);
    if (!entry) {
      entry = {
        nombreProvincia: provincia.nombre,
        parcelaIds: new Set(),
        cultivos: [],
        categoryRecords: [],
      };
      grouped.set(provincia.id, entry);
    }

    entry.parcelaIds.add(c.idParcela);
    entry.cultivos.push(c);

    if (c.idResultadoImpacto && categoryMap.has(c.idResultadoImpacto)) {
      entry.categoryRecords.push(categoryMap.get(c.idResultadoImpacto)!);
    }
  }

  const result: ProvinciaRankingItemDto[] = [];

  for (const [idProvincia, entry] of grouped) {
    const numCultivos = entry.cultivos.length;
    const superficieTotal = entry.cultivos.reduce(
      (sum, c) => sum + (c.superficieCultivada ?? 0),
      0,
    );
    const produccionMedia =
      numCultivos > 0
        ? entry.cultivos.reduce((sum, c) => sum + (c.produccion ?? 0), 0) /
          numCultivos
        : 0;
    const consumoAguaMedio =
      numCultivos > 0
        ? entry.cultivos.reduce((sum, c) => sum + (c.consumoAgua ?? 0), 0) /
          numCultivos
        : 0;

    const impactosPorCategoria = meanCategories(entry.categoryRecords);
    const impactoTotalMedio = round(totalImpact(impactosPorCategoria));
    const eficiencia =
      consumoAguaMedio > 0 ? produccionMedia / consumoAguaMedio : 0;

    result.push({
      idProvincia,
      nombreProvincia: entry.nombreProvincia,
      numParcelas: entry.parcelaIds.size,
      numCultivos,
      superficieTotal: round(superficieTotal),
      produccionMedia: round(produccionMedia),
      consumoAguaMedio: round(consumoAguaMedio),
      impactoTotalMedio,
      impactosPorCategoria,
      eficiencia: round(eficiencia * 100) / 100,
    });
  }

  return sortByImpact(result, categoria);
}

export function rankPoblaciones(
  cultivos: CultivoWithGeo[],
  categoryMap: Map<string, CategoryAmountRecord>,
  categoria?: EfCategoryId,
  idProvinciaPoblacion?: string,
): PoblacionRankingItemDto[] {
  const grouped = new Map<string, GroupedPoblacion>();

  for (const c of cultivos) {
    const poblacion = c.parcela?.poblacion;
    if (!poblacion) continue;

    if (
      idProvinciaPoblacion &&
      poblacion.provincia?.id !== idProvinciaPoblacion
    ) {
      continue;
    }

    let entry = grouped.get(poblacion.id);
    if (!entry) {
      entry = {
        nombrePoblacion: poblacion.nombre,
        nombreProvincia: poblacion.provincia?.nombre ?? '',
        parcelaIds: new Set(),
        categoryRecords: [],
      };
      grouped.set(poblacion.id, entry);
    }

    entry.parcelaIds.add(c.idParcela);

    if (c.idResultadoImpacto && categoryMap.has(c.idResultadoImpacto)) {
      entry.categoryRecords.push(categoryMap.get(c.idResultadoImpacto)!);
    }
  }

  const result: PoblacionRankingItemDto[] = [];

  for (const [idPoblacion, entry] of grouped) {
    const impactosPorCategoria = meanCategories(entry.categoryRecords);
    const impactoTotalMedio = round(totalImpact(impactosPorCategoria));

    result.push({
      idPoblacion,
      nombrePoblacion: entry.nombrePoblacion,
      nombreProvincia: entry.nombreProvincia,
      numParcelas: entry.parcelaIds.size,
      impactoTotalMedio,
      impactosPorCategoria,
    });
  }

  return sortByImpact(result, categoria);
}
