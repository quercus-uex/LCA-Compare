import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class UpdateProvinciaDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nombre?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  idCatastro?: number;

  @IsOptional()
  @IsUUID()
  idPais?: string;
}
