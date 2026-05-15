import {ApiProperty} from "@nestjs/swagger";

export class UsuarioDto {
    @ApiProperty({ format: 'uuid' })
    id: string;

    nombre: string;

    apellidos: string;

    @ApiProperty({ format: 'email' })
    email: string;

    rol: string;

    @ApiProperty({ format: 'date-time' })
    fechaRegistro: string;

    @ApiProperty({ format: 'date-time' })
    fechaActualizacion: string;

}