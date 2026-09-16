import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateParcelaDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsOptional()
  @IsString()
  sigpac?: string | null;

  @IsOptional()
  @IsString()
  refCat?: string | null;

  @IsOptional()
  @IsString()
  ptIdParcela?: string | null;

  @IsUUID()
  @IsNotEmpty()
  idPropietario: string;

  @IsOptional()
  @IsUUID()
  idPoblacion?: string | null;

  @IsOptional()
  @IsBoolean()
  esParcelaReferencia?: boolean;
}
