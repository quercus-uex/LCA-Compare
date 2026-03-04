import {
  IsDefined,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CompareQueryItemDto {
  @IsOptional()
  @IsUUID()
  idPoblacion?: string;

  @IsOptional()
  @IsUUID()
  idProvincia?: string;

  @IsOptional()
  @IsUUID()
  idParcela?: string;

  @IsOptional()
  @Type(() => Number)
  @IsLatitude()
  lat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsLongitude()
  long?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  range: number;

  @IsOptional()
  @IsString()
  tipoCultivo: string;
}

export class CompareQueryDto {
  @IsDefined()
  @ValidateNested()
  @Type(() => CompareQueryItemDto)
  left: CompareQueryItemDto;

  @ValidateNested()
  @Type(() => CompareQueryItemDto)
  right?: CompareQueryItemDto;
}
