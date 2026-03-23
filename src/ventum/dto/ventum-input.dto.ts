import {
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

export class SigpacDto {
  @IsOptional()
  @IsInt()
  provincia?: number;

  @IsOptional()
  @IsInt()
  municipio?: number;

  @IsOptional()
  @IsInt()
  poligono?: number;

  @IsOptional()
  @IsInt()
  parcela?: number;
}

class MetadatosParcelaDto {
  @IsInt()
  id: number;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => SigpacDto)
  es_sigpac: SigpacDto;

  @IsOptional()
  @IsString()
  es_referencia_catastral?: string;

  @IsOptional()
  @IsString()
  pt_id_parcela_predial?: string;

  @IsString()
  @IsNotEmpty()
  nombre: string;
}

class MetadatosCultivoDto {
  @IsInt()
  id: number;

  @IsInt()
  fecha_inicio_campania: number;

  @IsInt()
  fecha_fin_campania: number;

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
  @IsInt()
  id: number;

  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsOptional()
  @IsString()
  apellidos?: string;

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
