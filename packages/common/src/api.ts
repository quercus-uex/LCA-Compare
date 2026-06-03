export type ApiResponse<T> = {
  data: T;
};

export type ApiResponseArray<T> = {
  data: T[];
};

export type ApiErrorDto = {
  message: string;
  error: string;
  statusCode: number;
};

export type ResultadoImpactoItemDto = {
  category: string;
  amount: number;
  unit: string;
  count?: number;
};

export type ResultadoImpactoDto = {
  impacto_fertilizantes: ResultadoImpactoItemDto[];
  impacto_manejo_cultivo: ResultadoImpactoItemDto[];
  impacto_pesticidas: ResultadoImpactoItemDto[];
  impacto_sistema_riego: ResultadoImpactoItemDto[];
  impacto_total: ResultadoImpactoItemDto[];
};

export type ResultadoImpactoCompareDto = {
  resultado: ResultadoImpactoDto;
  nearbyMean: ResultadoImpactoDto;
};
