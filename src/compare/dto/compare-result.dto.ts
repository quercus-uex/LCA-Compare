export type CompareResultItemDto = {
  category: string;
  refAmount: number;
  tarAmount?: number;
  unit: string;
  diff?: number;
};

export class CompareResultDtoClass {
  impacto_fertilizantes: CompareResultItemDto[];
  impacto_manejo_cultivo: CompareResultItemDto[];
  impacto_pesticidas: CompareResultItemDto[];
  impacto_sistema_riego: CompareResultItemDto[];
  impacto_total: CompareResultItemDto[];
}

export type CompareResultDto = CompareResultDtoClass;
