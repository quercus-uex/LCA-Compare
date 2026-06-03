import type { Provincia } from 'common/location';
import type { PaisDto } from '../pais/dto/pais.dto';

export class ProvinciaDto implements Provincia {
  id: string;
  nombre: string;
  idCatastro: number;
  idPais: string;
  pais: PaisDto;
}
