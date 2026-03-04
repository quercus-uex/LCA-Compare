import { Controller, Get, Query } from '@nestjs/common';
import { PoblacionService } from './poblacion.service';

@Controller('/poblacion')
export class PoblacionController {
  constructor(private readonly poblacionService: PoblacionService) {}

  @Get('')
  async getByFilters(@Query('nombre') nombre: string) {
    return {
      data: await this.poblacionService.findMany({
        where: {
          nombre: { contains: nombre, mode: 'insensitive' },
        },
        take: 10,
      }),
    };
  }
}
