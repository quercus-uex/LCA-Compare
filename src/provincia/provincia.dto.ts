import { PaisDto } from '../pais/dto/pais.dto';

export class ProvinciaDto {
  id: string;
  nombre: string;
  idCatastro: number;
  idPais: string;
  pais: PaisDto;
}
