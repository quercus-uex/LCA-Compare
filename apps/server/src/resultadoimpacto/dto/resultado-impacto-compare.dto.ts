import { ResultadoImpactoDtoClass } from './resultado-impacto-item.dto';
import type { ResultadoImpactoCompareDto as ResultadoImpactoCompareShape } from 'common/api';

export class ResultadoImpactoCompareDto implements ResultadoImpactoCompareShape {
  resultado: ResultadoImpactoDtoClass;
  nearbyMean: ResultadoImpactoDtoClass;
}
