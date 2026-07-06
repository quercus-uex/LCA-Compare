import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateParcelaDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nombre?: string;

  @IsOptional()
  @IsString()
  sigpac?: string | null;

  @IsOptional()
  @IsString()
  refCat?: string | null;

  @IsOptional()
  @IsString()
  ptIdParcela?: string | null;

  @IsOptional()
  @IsUUID()
  idPropietario?: string;

  @IsOptional()
  @IsUUID()
  idPoblacion?: string | null;
}
