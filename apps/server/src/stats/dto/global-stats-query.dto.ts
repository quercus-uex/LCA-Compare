import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import type { GlobalStatsQuery } from 'common/stats';

// Un texto vacío equivale a no filtrar
const trimOrUndefined = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
};

export class GlobalStatsQueryDto implements GlobalStatsQuery {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(2100)
  anio?: number;

  @IsOptional()
  @Transform(trimOrUndefined)
  @IsString()
  @IsNotEmpty()
  tipoCultivo?: string;
}
