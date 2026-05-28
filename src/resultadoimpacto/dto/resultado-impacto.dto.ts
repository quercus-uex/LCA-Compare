import { ResultadoImpactoItemDto } from './resultado-impacto-item.dto';

export class ResultadoImpactoDto {
  impacto_fertilizantes: ResultadoImpactoItemDto[];
  impacto_manejo_cultivo: ResultadoImpactoItemDto[];
  impacto_pesticidas: ResultadoImpactoItemDto[];
  impacto_sistema_riego: ResultadoImpactoItemDto[];
  impacto_total: ResultadoImpactoItemDto[];
}
