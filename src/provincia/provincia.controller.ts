import { Controller, Get, Param } from '@nestjs/common';
import { ProvinciaService } from './provincia.service';
import { PoblacionService } from '../poblacion/poblacion.service';

@Controller('/provincia')
export class ProvinciaController {
  constructor(
    private readonly provinciaService: ProvinciaService,
    private readonly poblacionService: PoblacionService,
  ) {}

  @Get('')
  async getAll() {
    return { data: await this.provinciaService.findAll() };
  }

  @Get(':id/poblaciones')
  async getPoblacionesByProvinciaId(@Param('id') id: string) {
    return {
      data: await this.poblacionService.findMany({
        where: { idProvincia: id },
      }),
    };
  }
}
