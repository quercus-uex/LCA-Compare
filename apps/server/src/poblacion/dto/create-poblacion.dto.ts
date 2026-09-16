import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreatePoblacionDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  idCatastro: number;

  @IsUUID()
  @IsNotEmpty()
  idProvincia: string;
}
