import { IsNotEmpty, IsString } from 'class-validator';

export class CreateMetodoImpactoDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  nombre: string;
}
