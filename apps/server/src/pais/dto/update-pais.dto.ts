import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdatePaisDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nombre?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  codigo?: string;
}
