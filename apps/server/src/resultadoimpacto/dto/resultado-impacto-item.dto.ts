import type { ResultadoImpactoItemDto } from 'common/api';
export type { ResultadoImpactoItemDto } from 'common/api';

export class ResultadoImpactoDtoClass {
  impacto_fertilizantes: ResultadoImpactoItemDto[];
  impacto_manejo_cultivo: ResultadoImpactoItemDto[];
  impacto_pesticidas: ResultadoImpactoItemDto[];
  impacto_sistema_riego: ResultadoImpactoItemDto[];
  impacto_total: ResultadoImpactoItemDto[];
}
