import {ApiProperty} from "@nestjs/swagger";

export class CultivoDto {
    @ApiProperty({ format: 'uuid' })
    id: string;

    @ApiProperty({ format: 'date-time' })
    fechaInicioCampania: string;

    superficieCultivada: number;

    produccion: number;

    consumoAgua: number;

    ciclo: number;

    tipo: string;

    @ApiProperty({ format: 'uuid' })
    idParcela: string;

    @ApiProperty({ format: 'uuid' })
    idResultadoImpacto: string;
}