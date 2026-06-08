import type { CompareResultItemDto, CompareResultDto } from 'common/compare';
export type { CompareResultItemDto, CompareResultDto } from 'common/compare';

export class CompareResultDtoClass implements CompareResultDto {
  impacto_fertilizantes: CompareResultItemDto[];
  impacto_manejo_cultivo: CompareResultItemDto[];
  impacto_pesticidas: CompareResultItemDto[];
  impacto_sistema_riego: CompareResultItemDto[];
  impacto_total: CompareResultItemDto[];
}
