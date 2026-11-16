import { getEfCategoryId, normalizeEfName } from 'common/impact';
import { ResultadoImpactoWithRelations } from './compare.types';

// openLCA no siempre escribe igual el nombre de una categoría; se comparan por
// su categoría EF o, si no es una conocida, por el nombre normalizado. Los
// nombres distintos son pocos, así que la clave de cada uno se calcula una vez
const categoryKeys = new Map<string, string>();
export const getCategoryKey = (name: string): string => {
  let key = categoryKeys.get(name);
  if (key === undefined) {
    key = getEfCategoryId(name) ?? normalizeEfName(name);
    categoryKeys.set(name, key);
  }
  return key;
};

export function extractLocationData(results: ResultadoImpactoWithRelations[]) {
  const idsPais = [
    ...new Set(
      results
        .map((r) => r.cultivo?.parcela?.poblacion?.provincia?.idPais)
        .filter((p) => p !== undefined),
    ),
  ];
  const idsProvincia = [
    ...new Set(
      results
        .map((r) => r.cultivo?.parcela?.poblacion?.idProvincia)
        .filter((p) => p !== undefined),
    ),
  ];
  const idsPoblacion = [
    ...new Set(
      results
        .map((r) => r.cultivo?.parcela?.idPoblacion)
        .filter((p) => p !== null && p !== undefined),
    ),
  ];

  const years = results
    .map((r) => r.cultivo?.fechaInicioCampania.getFullYear())
    .filter(Boolean) as number[];

  return {
    idsPais,
    idsProvincia,
    idsPoblacion,
    minYear: Math.min(...years),
    maxYear: Math.max(...years),
  };
}
