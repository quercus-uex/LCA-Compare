import {Controller, Get, NotFoundException, Param} from '@nestjs/common';
import { ProvinciaService } from './provincia.service';
import { PoblacionService } from '../poblacion/poblacion.service';
import {ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags} from "@nestjs/swagger";
import {ProvinciaDto} from "./provincia.dto";
import {ApiResponseArrayDto} from "../common/dto/api-response-array.dto";
import {PoblacionDto} from "../poblacion/dto/poblacion.dto";
import {ApiErrorDto} from "../common/dto/api-error.dto";

@ApiTags('Provincia')
@Controller('/provincia')
export class ProvinciaController {
  constructor(
    private readonly provinciaService: ProvinciaService,
    private readonly poblacionService: PoblacionService,
  ) {}

  @Get('')
  @ApiOperation({ summary: 'Obtener todas las provincias' })
  @ApiOkResponse({
    description: 'Provincias',
    type: ApiResponseArrayDto(ProvinciaDto)
  })
  async getAll() {
    return { data: await this.provinciaService.findAll() };
  }

  @Get(':id/poblaciones')
  @ApiOperation({ summary: 'Obtener las poblaciones de una provincia por su ID' })
  @ApiNotFoundResponse({
    description: 'Provincia no encontrada',
    type: ApiErrorDto
  })
  @ApiOkResponse({
    description: 'Poblaciones de la provincia',
    type: ApiResponseArrayDto(PoblacionDto)
  })
  async getPoblacionesByProvinciaId(@Param('id') id: string) {
    const poblaciones = await this.poblacionService.findMany({
      where: { idProvincia: id },
    });

    if (poblaciones.length === 0) throw new NotFoundException('Provincia no encontrada')

    return {
      data: poblaciones,
    };
  }
}
