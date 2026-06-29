import {
  IsArray,
  IsDefined,
  IsIn,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import type {
  CompareQueryItemDto as CompareQueryItemShape,
  CompareReportLanguage,
} from 'common/compare';

export class CompareQueryItemDto implements CompareQueryItemShape {
  @IsOptional()
  @IsUUID()
  idPais?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  idsPoblacion?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  idsProvincia?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  idsParcela?: string[];

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
  range?: number;

  @IsOptional()
  @IsString()
  tipoCultivo?: string;

  @IsOptional()
  @IsNumber()
  @Min(2020)
  anioCampaniaInicio?: number;

  @IsOptional()
  @IsNumber()
  @Min(2020)
  anioCampaniaFin?: number;
}

export const COMPARE_REPORT_LANGUAGES: readonly CompareReportLanguage[] = [
  'es',
  'en',
  'pt',
];

export class CompareQueryDto {
  @IsDefined()
  @ValidateNested()
  @Type(() => CompareQueryItemDto)
  reference: CompareQueryItemDto;

  @ValidateNested()
  @Type(() => CompareQueryItemDto)
  target?: CompareQueryItemDto;

  @IsOptional()
  @IsIn(COMPARE_REPORT_LANGUAGES)
  language?: CompareReportLanguage;
}
