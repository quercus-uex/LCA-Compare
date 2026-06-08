import { ApiProperty } from '@nestjs/swagger';
import { Polygon } from 'geojson';
import { CultivoDto } from '../../cultivo/dto/cultivo.dto';
import type { Parcela } from 'common/parcela';

export class ParcelaDto implements Parcela {
  @ApiProperty({ format: 'uuid' })
  id: string;

  sigpac: string | null;

  refCat: string | null;

  ptIdParcela: string | null;

  nombre: string;

  @ApiProperty({ format: 'uuid' })
  idPropietario: string;

  @ApiProperty({ format: 'uuid' })
  idPoblacion: string;
}

export class ParcelaWithGeomDto extends ParcelaDto {
  cultivo: CultivoDto;

  geom: Polygon;
}
