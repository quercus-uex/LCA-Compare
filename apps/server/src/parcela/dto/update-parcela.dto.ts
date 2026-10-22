import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Transform } from 'class-transformer';

// Un texto vacío equivale a no tener identificador (los índices son únicos)
const emptyToNull = ({ value }: { value: unknown }) =>
  typeof value === 'string' && value.trim() === '' ? null : value;

export class UpdateParcelaDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nombre?: string;

  @IsOptional()
  @Transform(emptyToNull)
  @IsString()
  sigpac?: string | null;

  @IsOptional()
  @Transform(emptyToNull)
  @IsString()
  refCat?: string | null;

  @IsOptional()
  @Transform(emptyToNull)
  @IsString()
  ptIdParcela?: string | null;

  @IsOptional()
  @IsUUID()
  idPropietario?: string;

  @IsOptional()
  @Transform(emptyToNull)
  @IsUUID()
  idPoblacion?: string | null;

  @IsOptional()
  @IsBoolean()
  esParcelaReferencia?: boolean;
}
