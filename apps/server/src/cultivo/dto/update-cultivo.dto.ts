import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class UpdateCultivoDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  tipo?: string;

  @IsOptional()
  @IsDateString()
  @IsNotEmpty()
  fechaInicioCampania?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  superficieCultivada?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  produccion?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  consumoAgua?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  ciclo?: number;

  @IsOptional()
  @IsUUID()
  idParcela?: string;
}
