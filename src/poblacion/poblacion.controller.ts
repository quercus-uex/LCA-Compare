import { Controller, Get, Query } from '@nestjs/common';
import { PoblacionService } from './poblacion.service';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PoblacionDto } from './dto/poblacion.dto';
import { ApiResponseArrayDto } from '../common/dto/api-response-array.dto';

@ApiTags('Población')
@Controller('/poblacion')
export class PoblacionController {
  constructor(private readonly poblacionService: PoblacionService) {}

  @Get('')
  @ApiOperation({ summary: 'Obtener poblaciones por nombre' })
  @ApiOkResponse({
    description: 'Poblaciones',
    type: ApiResponseArrayDto(PoblacionDto),
  })
  async getByFilters(@Query('nombre') nombre: string) {
    const poblaciones = await this.poblacionService.findMany({
      where: {
        nombre: { contains: nombre, mode: 'insensitive' },
      },
      take: 10,
    });

    return {
      data: poblaciones,
    };
  }
}
