import { ResultadoImpactoWithRelations } from './compare.types';

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
        .map((r) => r.cultivo?.parcela.poblacion?.idProvincia)
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
