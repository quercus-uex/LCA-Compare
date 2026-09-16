import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateMetodoImpactoDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  id?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nombre?: string;
}
