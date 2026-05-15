import {ApiProperty} from "@nestjs/swagger";
import {Polygon} from "geojson";
import {CultivoDto} from "../../cultivo/dto/cultivo.dto";

export class ParcelaDto {
    @ApiProperty({ format: 'uuid' })
    id: string;

    sigpac: string | null;

    refCat: string | null;

    ptIdParcela: string | null;

    nombre: string;

    @ApiProperty({ format: 'uuid' })
    idPropietario: string;

    @ApiProperty({ format: 'uuid' })
    idPoblacion: string;
}

export class ParcelaWithGeomDto extends ParcelaDto {
    cultivo: CultivoDto;

    geom: Polygon;
}