import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateCultivoDto {
  @IsString()
  @IsNotEmpty()
  tipo: string;

  @IsDateString()
  @IsNotEmpty()
  fechaInicioCampania: string;

  @Type(() => Number)
  @IsNumber()
  superficieCultivada: number;

  @Type(() => Number)
  @IsNumber()
  produccion: number;

  @Type(() => Number)
  @IsNumber()
  consumoAgua: number;

  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  ciclo: number;

  @IsUUID()
  @IsNotEmpty()
  idParcela: string;
}
