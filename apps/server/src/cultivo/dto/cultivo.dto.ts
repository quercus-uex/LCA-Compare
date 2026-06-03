import { ApiProperty } from '@nestjs/swagger';
import type { Cultivo } from 'common/parcela';

export class CultivoDto implements Cultivo {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'date-time' })
  fechaInicioCampania: string;

  superficieCultivada: number;

  produccion: number;

  consumoAgua: number;

  ciclo: number;

  tipo: string;

  @ApiProperty({ format: 'uuid' })
  idParcela: string;

  @ApiProperty({ format: 'uuid' })
  idResultadoImpacto: string;
}
