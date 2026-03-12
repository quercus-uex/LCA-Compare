export type ResultadoImpactoItemDto = {
  category: string;
  amount: number;
  unit: string;
  count?: number;
};

export type ResultadoImpactoDataDto = {
  impacto_fertilizantes: ResultadoImpactoItemDto[];
  impacto_manejo_cultivo: ResultadoImpactoItemDto[];
  impacto_pesticidas: ResultadoImpactoItemDto[];
  impacto_sistema_riego: ResultadoImpactoItemDto[];
  impacto_total: ResultadoImpactoItemDto[];
};
