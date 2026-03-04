export type CompareResultItemDto = {
  category: string;
  amount: number;
  unit: string;
  count?: number;
};

export type CompareResultDto = {
  impacto_fertilizantes: CompareResultItemDto[];
  impacto_manejo_cultivo: CompareResultItemDto[];
  impacto_pesticidas: CompareResultItemDto[];
  impacto_sistema_riego: CompareResultItemDto[];
  impacto_total: CompareResultItemDto[];
};