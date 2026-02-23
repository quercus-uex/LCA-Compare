import {
  ArrayNotContains,
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class MetadatosParcelaDto {
  @IsOptional()
  @IsString()
  sigpac?: string;

  @IsOptional()
  @IsString()
  referencia_catastral?: string;

  @IsString()
  @IsNotEmpty()
  nombre: string;
}

class MetadatosCultivoDto {
  @IsNumber()
  @IsNotEmpty()
  superficie_cultivada: number;

  @IsNumber()
  @IsNotEmpty()
  produccion: number;

  @IsNumber()
  @IsNotEmpty()
  consumo_agua: number;

  @IsInt()
  @IsNotEmpty()
  ciclo: number;

  @IsString()
  @IsNotEmpty()
  tipo: string;
}

class MetadatosUsuarioDto {
  @IsString()
  @IsNotEmpty()
  dni: string;

  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  apellidos: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;
}

class MetadatosDto {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => MetadatosParcelaDto)
  parcela: MetadatosParcelaDto;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => MetadatosCultivoDto)
  cultivo: MetadatosCultivoDto;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => MetadatosUsuarioDto)
  usuario: MetadatosUsuarioDto;
}

class ImpactoDto {
  @IsNotEmpty()
  @IsString()
  category: string;

  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsNotEmpty()
  @IsString()
  unit: string;
}

class ResultadosDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ImpactoDto)
  impacto_fertilizantes: ImpactoDto[];

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ImpactoDto)
  impacto_manejo_cultivo: ImpactoDto[];

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ImpactoDto)
  impacto_pesticidas: ImpactoDto[];

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ImpactoDto)
  impacto_sistema_riego: ImpactoDto[];

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ImpactoDto)
  impacto_total: ImpactoDto[];
}

export class VentumInputDto {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => MetadatosDto)
  metadatos: MetadatosDto;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => ResultadosDto)
  resultado: ResultadosDto;
}
