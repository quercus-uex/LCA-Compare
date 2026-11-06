import { ApiProperty } from '@nestjs/swagger';
import { Polygon } from 'geojson';
import { CultivoDto } from '../../cultivo/dto/cultivo.dto';
import type { CategoryValues } from 'common/stats';
import type {
  CultivoConImpacto,
  CultivoResumen,
  Parcela,
  ParcelaDetalle,
  ParcelaPoblacion,
  ParcelaResumen,
} from 'common/parcela';

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
  idPoblacion: string | null;

  @ApiProperty()
  esParcelaReferencia: boolean;
}

class ProvinciaRefDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  nombre: string;
}

export class ParcelaPoblacionDto implements ParcelaPoblacion {
  @ApiProperty({ format: 'uuid' })
  id: string;

  nombre: string;

  provincia: ProvinciaRefDto;
}

export class CultivoResumenDto implements CultivoResumen {
  @ApiProperty({ format: 'uuid' })
  id: string;

  tipo: string;

  @ApiProperty({ format: 'date-time' })
  fechaInicioCampania: string;

  superficieCultivada: number;
}

export class ParcelaResumenDto extends ParcelaDto implements ParcelaResumen {
  poblacion: ParcelaPoblacionDto | null;

  @ApiProperty({ nullable: true, description: 'Cultivo más reciente' })
  ultimoCultivo: CultivoResumenDto | null;

  @ApiProperty({ description: 'Número de campañas de la parcela' })
  numCultivos: number;

  @ApiProperty({ nullable: true, description: 'Polígono GeoJSON (EPSG:4326)' })
  geom: Polygon | null;
}

export class CultivoConImpactoDto
  extends CultivoDto
  implements CultivoConImpacto
{
  @ApiProperty({
    nullable: true,
    description:
      'Impacto total del resultado por categoría EF; omite las categorías que no trae el resultado',
    additionalProperties: { type: 'number' },
  })
  impactoTotal: Partial<CategoryValues> | null;
}

export class ParcelaDetalleDto extends ParcelaDto implements ParcelaDetalle {
  poblacion: ParcelaPoblacionDto | null;

  @ApiProperty({
    type: [CultivoConImpactoDto],
    description: 'Cultivos del más reciente al más antiguo',
  })
  cultivos: CultivoConImpactoDto[];

  @ApiProperty({ nullable: true, description: 'Polígono GeoJSON (EPSG:4326)' })
  geom: Polygon | null;
}
